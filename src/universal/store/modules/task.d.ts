import { Module, Context } from "../store";
import { Task, TaskNode } from 'treelike-task';

export namespace TaskModule {
    interface State {
        tree: { [uuid: string]: TaskNode },
        tasks: TaskNode[],
        maxLog: number,
    }
    interface Mutations {
        create(state: State, option: { id: string, name: string }): void;
        prune(state: State): void;
        hook(state: State, option: { id: string, task: Task.Node }): void;
        $update(state: State, option: {
            adds: { id: string, node: Task.Node }[],
            childs: { id: string, node: Task.Node }[],
            updates: { id: string, progress: number, total: number, message: string, time: string }[],
            statuses: { id: string, status: string }[],
        }): void;
    }

    type C = Context<TaskModule.State, {}, TaskModule.Mutations, TaskModule.Actions>;
    interface Actions {
        execute(context: C, task: Task<any>): Promise<string>;
        spawn(context: C, name: string): Promise<string>;
        update(context: C, data: { id: string }): Promise<void>;
        wait(context: C, uuid: string): Promise<any>;
        cancel(context: C, uuid: string): Promise<void>;
    }

}

export type TaskModule = Module<TaskModule.State, TaskModule.Mutations, TaskModule.Actions>;
