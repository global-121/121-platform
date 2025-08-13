import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import tailwindConfig from '~/../../tailwind.config';

const colors = tailwindConfig.theme.colors;

export const registerChartDefaults = () => {
  const styles = getComputedStyle(document.documentElement);

  Chart.defaults.font.family = styles.getPropertyValue('--font-display');
  Chart.defaults.font.weight = 500;

  Chart.defaults.scale.ticks.color = colors.black.DEFAULT;

  Chart.register(ChartDataLabels);

  if (!Chart.defaults.plugins.datalabels) {
    console.error('Chart.js datalabels plugin failed to load');
  } else {
    Chart.defaults.plugins.datalabels.color = colors.black.DEFAULT;
  }
};
