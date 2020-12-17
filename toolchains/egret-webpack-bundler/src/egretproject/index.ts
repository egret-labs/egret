import { projectData, Target_Type } from "./data";

export function getLibsFileList(target: Target_Type, projectRoot: string, mode: "debug" | "release") {
    projectData.init(projectRoot)
    const result: string[] = [];
    projectData.getModulesConfig(target).forEach(m => {
        m.target.forEach(m => {
            const filename = mode == 'debug' ? m.debug : m.release;
            result.push(filename);
        });
    });
    return result;
}