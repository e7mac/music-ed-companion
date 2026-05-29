export function buildAssetUrl(baseUrl: string, chapterName: string, file: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}${chapterName}/${file}`;
}
