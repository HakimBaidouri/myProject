// Detail line (inside a main line)
export interface DetailTableLine {
    id: number;
    mainTableLineId: number;
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
  
// Main line (inside a chapter)
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
}

// Wrapper from DTO backend
export interface MainTableLineWithDetails {
    mainTableLine: MainTableLine;
    details: DetailTableLine[];
}

// Chapter entity
export interface Chapter {
    id: number;
    projectId: number;
    parentId: number | null;
    num: string;
    label: string;
}

// Wrapper from DTO backend
export interface ChapterWithLines {
    chapter: Chapter;
    lines: MainTableLineWithDetails[];
}
  
// Project
export interface Project {
    id: number;
    name: string;
    userId: number;
    companyId: number;
}
  
// Final structure returned by backend on /projects/{id}/full
export interface ProjectFull {
    project: Project;
    chapters: ChapterWithLines[];
}
  