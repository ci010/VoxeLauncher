import { Task, TaskNode } from 'treelike-task';
import { Context, Module } from "../store";


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
        executeTask(context: C, task: Task<any>): Promise<string>;
        spawnTask(context: C, name: string): Promise<string>;
        updateTask(context: C, data: { id: string, progress: number, total?: number, message?: string }): Promise<void>;
        waitTask(context: C, uuid: string): Promise<any>;
        finishTask(context: C, payload: { id: string }): Promise<void>;
        cancelTask(context: C, uuid: string): Promise<void>;
    }

}

export type TaskModule = Module<TaskModule.State, {}, TaskModule.Mutations, TaskModule.Actions>;
