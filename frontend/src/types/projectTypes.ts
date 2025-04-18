export interface DetailTableLine {
    id: number;
    title: string;
    number: number;
    length: number;
    width: number;
    height: number;
    factor: number;
    total: number;
    comments: string;
    position: number;
  }
  
  export interface MainTableLine {
    id: number;
    chapterId: number;
    gr: string;
    num: string;
    title: string;
    nm: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    comments: string;
    position: number;
    details: DetailTableLine[];
  }
  
  export interface Chapter {
    id: number;
    projectId: number;
    parentId: number | null;
    num: string;
    label: string;
    lines: MainTableLine[];
  }
  
  export interface Project {
    id: number;
    name: string;
    userId: number;
    companyId: number;
  }
  
  export interface ProjectFull {
    project: Project;
    chapters: Chapter[];
  }
  