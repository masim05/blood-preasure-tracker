package com.masim05.bloodpressure.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.matchParentSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.ui.TestTags

internal data class GuideExamplePanel(
    val isGood: Boolean,
    val variant: GuideExampleVariant,
)

internal enum class GuideExampleVariant {
    FullDisplayCentered,
    FullDisplayAngled,
    CroppedDisplay,
    MissingArm,
}

internal fun guideExamplePanels(): List<GuideExamplePanel> = listOf(
    GuideExamplePanel(isGood = true, variant = GuideExampleVariant.FullDisplayCentered),
    GuideExamplePanel(isGood = true, variant = GuideExampleVariant.FullDisplayAngled),
    GuideExamplePanel(isGood = false, variant = GuideExampleVariant.CroppedDisplay),
    GuideExamplePanel(isGood = false, variant = GuideExampleVariant.MissingArm),
)

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun GuideScreen(onNext: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .semantics { testTagsAsResourceId = true }
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
            .testTag(TestTags.GuideScreen),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.guide_title),
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center,
        )
        Text(
            text = stringResource(R.string.guide_copy),
            modifier = Modifier.fillMaxWidth(),
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
        )
        GuideExampleCollage(
            examples = guideExamplePanels(),
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("guide_continue"),
            onClick = onNext,
        ) {
            Text(stringResource(R.string.guide_continue))
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun GuideExampleCollage(examples: List<GuideExamplePanel>, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        examples.chunked(2).forEach { rowExamples ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                rowExamples.forEach { example ->
                    GuideExampleCard(
                        example = example,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}

@Composable
private fun GuideExampleCard(example: GuideExamplePanel, modifier: Modifier = Modifier) {
    val borderColor = if (example.isGood) Color(0xFFBBF7D0) else Color(0xFFFECACA)
    val iconTint = if (example.isGood) Color(0xFF16A34A) else Color(0xFFDC2626)

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White)
            .border(width = 2.dp, color = borderColor, shape = RoundedCornerShape(20.dp)),
    ) {
        GuideExampleIllustration(
            variant = example.variant,
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
        )
        Icon(
            imageVector = if (example.isGood) Icons.Filled.CheckCircle else Icons.Filled.Cancel,
            contentDescription = null,
            tint = iconTint,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(10.dp)
                .size(28.dp),
        )
    }
}

@Composable
private fun GuideExampleIllustration(variant: GuideExampleVariant, modifier: Modifier = Modifier) {
    val background = when (variant) {
        GuideExampleVariant.MissingArm -> Brush.linearGradient(listOf(Color(0xFFD1D5DB), Color(0xFF9CA3AF)))
        else -> Brush.linearGradient(listOf(Color(0xFFE0F2FE), Color(0xFFF8FAFC)))
    }
    val monitorOffsetX = when (variant) {
        GuideExampleVariant.CroppedDisplay -> (-18).dp
        else -> 0.dp
    }
    val monitorOffsetY = when (variant) {
        GuideExampleVariant.FullDisplayAngled -> 8.dp
        else -> 0.dp
    }
    val monitorRotation = when (variant) {
        GuideExampleVariant.FullDisplayAngled -> -10f
        GuideExampleVariant.MissingArm -> 8f
        else -> 0f
    }
    val showArm = variant != GuideExampleVariant.MissingArm
    val armOffsetX = when (variant) {
        GuideExampleVariant.CroppedDisplay -> 28.dp
        GuideExampleVariant.FullDisplayAngled -> 14.dp
        else -> 0.dp
    }
    val armOffsetY = when (variant) {
        GuideExampleVariant.FullDisplayAngled -> 10.dp
        else -> 0.dp
    }
    val veilAlpha = when (variant) {
        GuideExampleVariant.CroppedDisplay -> 0.18f
        GuideExampleVariant.MissingArm -> 0.28f
        else -> 0f
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(background),
    ) {
        if (showArm) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .offset(x = armOffsetX, y = armOffsetY)
                    .fillMaxWidth(0.72f)
                    .height(26.dp)
                    .clip(RoundedCornerShape(50))
                    .background(Color(0xFFD6A77A)),
            )
        }
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .offset(x = monitorOffsetX, y = monitorOffsetY)
                .graphicsLayer { rotationZ = monitorRotation }
                .fillMaxWidth(0.56f)
                .aspectRatio(1.18f)
                .clip(RoundedCornerShape(18.dp))
                .background(Color(0xFF0F172A)),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFFE2E8F0)),
            ) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 12.dp)
                        .fillMaxWidth(0.68f)
                        .height(10.dp)
                        .clip(RoundedCornerShape(50))
                        .background(Color(0xFF94A3B8)),
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .fillMaxWidth(0.74f)
                        .height(24.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (variant == GuideExampleVariant.MissingArm) Color(0xFFCBD5E1) else Color.White),
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 12.dp)
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFBFDBFE)),
                )
            }
        }
        if (veilAlpha > 0f) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(Color.White.copy(alpha = veilAlpha)),
            )
        }
    }
}