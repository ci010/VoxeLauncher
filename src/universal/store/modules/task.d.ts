import { FullModule } from "vuex";
import { RootState } from "../store";

export namespace TaskModule {
    interface Task { }
    interface TreeNode { [uuid: string]: string | TreeNode }
    interface State {
        tree: TreeNode,
        flat: { [nodeId: string]: Task },
        running: string[],
        all: string[],
    }
}

export type TaskModule = FullModule<TaskModule.State, RootState, {}, {}, {}>;
