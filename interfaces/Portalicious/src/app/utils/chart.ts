import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

export function registerChartDefaults() {
  const documentStyle = getComputedStyle(document.documentElement);

  Chart.defaults.scale.ticks.color =
    documentStyle.getPropertyValue('--text-color');

  Chart.register(ChartDataLabels);

  if (!Chart.defaults.plugins.datalabels) {
    console.error('Chart.js datalabels plugin failed to load');
  } else {
    Chart.defaults.plugins.datalabels.color =
      documentStyle.getPropertyValue('--text-color');
  }
}
