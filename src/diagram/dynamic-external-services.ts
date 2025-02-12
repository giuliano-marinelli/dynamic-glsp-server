export const ExternalServices = Symbol('ExternalServices');

export interface ExternalServices {
  languageProvider?: (languageID: string, connectionAuth: any) => Promise<any> | any;
  modelProvider?: (modelID: string, connectionAuth: any) => Promise<any> | any;
  modelSaver?: (modelID: string, model: any, preview: any, connectionAuth: any) => Promise<any> | any;
}
