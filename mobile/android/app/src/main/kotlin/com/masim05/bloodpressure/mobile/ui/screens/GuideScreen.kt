package com.masim05.bloodpressure.mobile.ui.screens

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.masim05.bloodpressure.mobile.R
import com.masim05.bloodpressure.mobile.ui.TestTags

internal data class GuideExamplePanel(
    val isGood: Boolean,
    @DrawableRes val drawableRes: Int,
)

internal fun guideExamplePanels(): List<GuideExamplePanel> = listOf(
    GuideExamplePanel(isGood = true, drawableRes = R.drawable.guide_example_good1),
    GuideExamplePanel(isGood = true, drawableRes = R.drawable.guide_example_good2),
    GuideExamplePanel(isGood = false, drawableRes = R.drawable.guide_example_bad1),
    GuideExamplePanel(isGood = false, drawableRes = R.drawable.guide_example_bad2),
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
    val borderColor = if (example.isGood) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer
    val iconTint = if (example.isGood) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
    val badgeContentDescription = stringResource(
        if (example.isGood) R.string.guide_example_good else R.string.guide_example_bad
    )

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(20.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(width = 2.dp, color = borderColor, shape = RoundedCornerShape(20.dp)),
    ) {
        Image(
            painter = painterResource(example.drawableRes),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(20.dp)),
        )
        Icon(
            imageVector = if (example.isGood) Icons.Filled.CheckCircle else Icons.Filled.Cancel,
            contentDescription = badgeContentDescription,
            tint = iconTint,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(10.dp)
                .size(28.dp),
        )
    }
}
