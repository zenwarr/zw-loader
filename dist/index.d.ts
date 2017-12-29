import * as base from "@zcomp/base";
export declare type LoadDoneCallback = (err: Error | null, data: string | null) => void;
export declare type LoadCallback = (url: string, done: LoadDoneCallback, component: Loader) => void;
export declare type ApplyDoneCallback = (err: Error | null) => void;
export declare type ApplyCallback = (component: Loader, content: string | null, done: ApplyDoneCallback) => void;
export declare enum LoadState {
    NotLoaded = 0,
    Loading = 1,
    Loaded = 2,
    LoadError = 3,
}
export interface LoaderOptions extends base.ComponentOptions {
    /**
     * Custom loader
     */
    loader?: LoadCallback;
    /**
     * Timeout to be used for async requests
     */
    requestTimeout?: number;
    /**
     * Class to add when component is in not-loaded state
     */
    notLoadedClass?: string;
    /**
     * Class to add when component is in loading state
     */
    loadingClass?: string;
    /**
     * Class to add when component is in loaded state
     */
    loadedClass?: string;
    /**
     * Class to add when loading failed
     */
    loadErrorClass?: string;
    /**
     * Selector for element where error message will be displayed
     */
    errorSelector?: string;
    /**
     * Timeout after which component should go into loading state
     */
    instantLoadTimeout?: number;
    /**
     * Name of event fired when state changes
     */
    loadStateChangedEvent?: string;
    /**
     * Attribute containing url
     */
    urlAttr?: string;
    /**
     * Custom apply routine
     */
    applier?: ApplyCallback;
    /**
     * Attribute for marking plain-text components
     */
    plainTextAttr?: string;
    /**
     * Whether components should be plain-text by default
     */
    plainText?: boolean;
    /**
     * Selector for element which children will be replaced by content
     */
    contentSelector?: string;
}
export declare const DefaultOptions: LoaderOptions;
export interface ChangeStateEvent extends CustomEvent {
    detail: {
        newState: LoadState;
    };
}
export declare class Loader extends base.Component<LoaderOptions> {
    constructor(root: Element, options: LoaderOptions);
    readonly plainText: boolean;
    readonly loadState: LoadState;
    load(): void;
    url: string | null;
    readonly contentElement: Element;
    applyContent(content: string): void;
    /** Protected area **/
    protected _state: LoadState;
    protected _plainText: boolean;
    protected _setState(state: LoadState): void;
    protected _syncClasses(): void;
    protected _setError(err: Error): void;
}
export declare const LoaderFactory: base.ComponentFactory<Loader, LoaderOptions>;
