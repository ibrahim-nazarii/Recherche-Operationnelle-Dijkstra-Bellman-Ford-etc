declare module 'html-to-docx' {
  const htmlToDocx: (
    html: string,
    options?: Record<string, unknown>
  ) => Promise<Buffer>;
  export default htmlToDocx;
}
