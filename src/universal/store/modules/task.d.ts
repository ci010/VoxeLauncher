import { Task, TaskNode } from 'treelike-task';
import { Context, Module, TaskHandle } from "../store";


export interface TNode extends TaskNode {
    _internalId: string
    tasks: TNode[]
    time?: string
    status: string
}
export namespace TaskModule {

    interface State {
        tree: { [uuid: string]: TNode },
        tasks: TNode[],
        maxLog: number,
    }
    interface Mutations {
        createTask(state: State, option: { id: string, name: string }): void;
        pruneTasks(state: State): void;
        hookTask(state: State, option: { id: string, task: TNode }): void;
        updateBatchTask(state: State, option: {
            adds: { id: string, node: TNode }[],
            childs: { id: string, node: TNode }[],
            updates: { [id: string]: { progress?: number, total?: number, message?: string, time?: string } },
            statuses: { id: string, status: string }[],
        }): void;
    }

    type C = Context<TaskModule.State, {}, TaskModule.Mutations, TaskModule.Actions>;
    interface Actions {
        executeTask(context: C, task: Task<any>): Promise<TaskHandle>;
        spawnTask(context: C, name: string): Promise<TaskHandle>;
        updateTask(context: C, data: { id: TaskHandle, progress: number, total?: number, message?: string }): Promise<void>;
        waitTask(context: C, uuid: TaskHandle): Promise<any>;
        finishTask(context: C, payload: { id: TaskHandle }): Promise<void>;
        cancelTask(context: C, uuid: TaskHandle): Promise<void>;
    }

}

export type TaskModule = Module<"task", TaskModule.State, {}, TaskModule.Mutations, TaskModule.Actions>;
