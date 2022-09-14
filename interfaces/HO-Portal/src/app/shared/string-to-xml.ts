
export function stringToXml(xmltext: string, filename: string): void {
  const pom = document.createElement('a');
  const bb = new Blob([xmltext], { type: 'text/plain' });

  pom.setAttribute('href', window.URL.createObjectURL(bb));
  pom.setAttribute('download', filename);

  pom.dataset.downloadurl = ['text/plain', pom.download, pom.href].join(':');
  pom.draggable = true;
  pom.classList.add('dragout');

  pom.click();
}
