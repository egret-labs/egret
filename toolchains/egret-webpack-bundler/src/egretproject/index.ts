import { EgretProjectData } from './data';

export function createProject(projectRoot: string) {
    const project = new EgretProjectData();
    project.init(projectRoot);
    return project;
}