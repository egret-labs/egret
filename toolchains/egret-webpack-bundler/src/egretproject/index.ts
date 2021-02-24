import { projectData } from './data';

export function createProject(projectRoot: string) {
    projectData.init(projectRoot);
    return projectData;
}