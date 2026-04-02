// Minimal type declarations for SheetJS xlsx library loaded via CDN
declare module "xlsx" {
  interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  }
  interface WorkSheet {
    [key: string]: any;
  }
  interface ParsingOptions {
    type?: "base64" | "binary" | "buffer" | "file" | "array" | "string";
    [key: string]: any;
  }
  interface Sheet2JSONOpts {
    header?: number | string[] | "A";
    raw?: boolean;
    range?: any;
    defval?: any;
    blankrows?: boolean;
    [key: string]: any;
  }
  interface WritingOptions {
    bookType?: string;
    type?: string;
    [key: string]: any;
  }
  const utils: {
    book_new(): WorkBook;
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name: string): void;
    sheet_to_json<T>(ws: WorkSheet, opts?: Sheet2JSONOpts): T[];
    aoa_to_sheet(data: any[][]): WorkSheet;
    json_to_sheet(data: object[], opts?: any): WorkSheet;
  };
  function read(data: any, opts?: ParsingOptions): WorkBook;
  function writeFile(
    wb: WorkBook,
    filename: string,
    opts?: WritingOptions,
  ): void;
  function write(wb: WorkBook, opts?: WritingOptions): any;
}
