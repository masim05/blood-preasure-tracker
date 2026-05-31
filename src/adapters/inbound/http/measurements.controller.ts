/* istanbul ignore file */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Readable } from 'node:stream';

import { GetMeasurementDetailUseCase } from '../../../application/use-cases/get-measurement-detail.use-case';
import { GetMeasurementImageUseCase } from '../../../application/use-cases/get-measurement-image.use-case';
import { ListMeasurementsUseCase } from '../../../application/use-cases/list-measurements.use-case';
import { OverrideMeasurementUseCase } from '../../../application/use-cases/override-measurement.use-case';
import { SaveMeasurementUseCase } from '../../../application/use-cases/save-measurement.use-case';
import { SubmitMeasurementImageUseCase } from '../../../application/use-cases/submit-measurement-image.use-case';
import { MAX_UPLOAD_BYTES } from '../../../domain/services/upload-image-policy';
import { BearerAuthGuard, type AuthenticatedHttpRequest } from './bearer-auth.guard';
import {
  type MeasurementQueryDto,
  type MeasurementOverrideDto,
  type MeasurementUploadFile,
  parseMeasurementOverride,
  parseOptionalPositiveInteger,
} from './dto/measurement.dto';
import { ApiError, toHttpException } from './http-error.mapper';

@Controller('/api/v1/measurements')
@UseGuards(BearerAuthGuard)
export class MeasurementsController {
  constructor(
    private readonly submitMeasurementImage: SubmitMeasurementImageUseCase,
    private readonly getMeasurementDetail: GetMeasurementDetailUseCase,
    private readonly saveMeasurement: SaveMeasurementUseCase,
    private readonly overrideMeasurement: OverrideMeasurementUseCase,
    private readonly listMeasurements: ListMeasurementsUseCase,
    private readonly getMeasurementImage: GetMeasurementImageUseCase,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  async upload(
    @Req() request: AuthenticatedHttpRequest,
    @UploadedFile() image?: MeasurementUploadFile,
  ): Promise<unknown> {
    try {
      const userId = requireUserId(request);
      if (!image) {
        throw new ApiError('validation_error', 'image is required');
      }

      return await this.submitMeasurementImage.execute({
        userId,
        contentType: image.mimetype,
        originalName: image.originalname,
        data: image.buffer,
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Get()
  async list(
    @Req() request: AuthenticatedHttpRequest,
    @Query() query: MeasurementQueryDto,
  ): Promise<unknown> {
    try {
      return await this.listMeasurements.execute({
        userId: requireUserId(request),
        page: parseOptionalPositiveInteger(query.page),
        pageSize: parseOptionalPositiveInteger(query.pageSize),
        from: query.from,
        to: query.to,
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Get('/:id')
  async detail(
    @Req() request: AuthenticatedHttpRequest,
    @Param('id') measurementId: string,
  ): Promise<unknown> {
    try {
      return await this.getMeasurementDetail.execute({ userId: requireUserId(request), measurementId });
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Get('/:id/image')
  async image(
    @Req() request: AuthenticatedHttpRequest,
    @Param('id') measurementId: string,
    @Res({ passthrough: true }) response: HeaderResponse,
  ): Promise<StreamableFile> {
    try {
      const output = await this.getMeasurementImage.execute({
        userId: requireUserId(request),
        measurementId,
      });
      response.setHeader('Content-Type', output.image.contentType);
      response.setHeader('Content-Length', String(output.image.byteSize));
      response.setHeader('Content-Disposition', `attachment; filename="${measurementId}${imageExtension(output.image.contentType)}"`);
      response.setHeader('X-Content-Type-Options', 'nosniff');

      return new StreamableFile(Readable.from(output.data));
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Post('/:id/save')
  async save(
    @Req() request: AuthenticatedHttpRequest,
    @Param('id') measurementId: string,
  ): Promise<unknown> {
    try {
      return await this.saveMeasurement.execute({ userId: requireUserId(request), measurementId });
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Post('/:id/override')
  async override(
    @Req() request: AuthenticatedHttpRequest,
    @Param('id') measurementId: string,
    @Body() body: MeasurementOverrideDto,
  ): Promise<unknown> {
    try {
      const override = parseMeasurementOverride(body);
      return await this.overrideMeasurement.execute({
        userId: requireUserId(request),
        measurementId,
        systolic: override.systolic,
        diastolic: override.diastolic,
        pulse: override.pulse,
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }
}

type HeaderResponse = {
  setHeader(name: string, value: string): void;
};

function requireUserId(request: AuthenticatedHttpRequest): string {
  if (!request.user) {
    throw new ApiError('unauthorized', 'Bearer token is required');
  }

  return request.user.id;
}

function imageExtension(contentType: 'image/jpeg' | 'image/png'): string {
  return contentType === 'image/png' ? '.png' : '.jpg';
}
