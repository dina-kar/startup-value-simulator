declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[]
    filename?: string
    image?: {
      type?: string
      quality?: number
    }
    html2canvas?: {
      scale?: number
      useCORS?: boolean
      allowTaint?: boolean
      backgroundColor?: string
      width?: number
      height?: number
    }
    jsPDF?: {
      unit?: string
      format?: string
      orientation?: string
      compressPDF?: boolean
    }
    pagebreak?: {
      mode?: string | string[]
      before?: string | string[]
      after?: string | string[]
      avoid?: string | string[]
    }
  }

  interface Html2PdfWorker {
    from(element: HTMLElement): Html2PdfWorker
    set(options: Html2PdfOptions): Html2PdfWorker
    save(): Promise<void>
    output(type?: string): Promise<unknown>
    then(onFulfilled?: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown): Html2PdfWorker
    toPdf(): Html2PdfWorker
    toCanvas(): Html2PdfWorker
    toImg(): Html2PdfWorker
  }

  function html2pdf(): Html2PdfWorker
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Promise<void>

  export = html2pdf
}
