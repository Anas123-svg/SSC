/** Only records linked to this exact project and its owner workspace are in scope. */
export const projectRecords = (records, project) => records.filter(r => r.projectId === project.id && r.workspaceId === project.workspaceId);
