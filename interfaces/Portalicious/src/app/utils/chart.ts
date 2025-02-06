import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { getTailwindConfig } from '~/utils/tailwind';

const tailwindConfig = getTailwindConfig();
const colors = tailwindConfig.theme.colors;

export function registerChartDefaults() {
  Chart.defaults.font.family =
    tailwindConfig.theme.fontFamily.display.join(', ');
  Chart.defaults.font.weight = 500;

  Chart.defaults.scale.ticks.color = colors.black.DEFAULT;

  Chart.register(ChartDataLabels);

  if (!Chart.defaults.plugins.datalabels) {
    console.error('Chart.js datalabels plugin failed to load');
  } else {
    Chart.defaults.plugins.datalabels.color = colors.black.DEFAULT;
  }
}
