import { Injectable } from '@nestjs/common';

export type ParsedCliArgs = {
  command: 'predict' | 'eval' | null;
  help: boolean;
  inputDirectory: string | null;
  evaluationCsvPath: string | null;
  provider: string | null;
  model: string | null;
};

@Injectable()
export class CliParser {
  parse(argv: string[]): ParsedCliArgs {
    const parsedArgs: ParsedCliArgs = {
      command: null,
      help: false,
      inputDirectory: null,
      evaluationCsvPath: null,
      provider: null,
      model: null,
    };

    const args = [...argv];
    while (args.length > 0) {
      const current = args.shift();
      if (!current) {
        continue;
      }

      if (current === '--help' || current === '-h') {
        parsedArgs.help = true;
        continue;
      }

      if (current === 'predict' || current === 'eval') {
        parsedArgs.command = current;
        continue;
      }

      if (current === '--input') {
        parsedArgs.inputDirectory = shiftValue(args, '--input');
        continue;
      }

      if (current === '--csv') {
        parsedArgs.evaluationCsvPath = shiftValue(args, '--csv');
        continue;
      }

      if (current === '--provider') {
        parsedArgs.provider = shiftValue(args, '--provider');
        continue;
      }

      if (current === '--model') {
        parsedArgs.model = shiftValue(args, '--model');
        continue;
      }

      throw new Error(`Unknown CLI argument: ${current}`);
    }

    return parsedArgs;
  }
}

function shiftValue(args: string[], optionName: string): string {
  const value = args.shift();
  if (!value) {
    throw new Error(`Missing value for ${optionName}`);
  }

  return value;
}