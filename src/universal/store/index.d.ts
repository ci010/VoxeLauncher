import { Module, Context, RootState, RootGetter, BaseActions, BaseGetters, BaseMutations, BaseState } from "./store";
import { StoreOptions } from 'vuex';

export interface RootModule extends Module<BaseState, BaseGetters, BaseMutations, BaseActions> {
    modules: any
    strict: boolean
}

declare var template: StoreOptions<RootState>;
export = template