
interface NodeRequire extends NodeRequireFunction {
    resolve: RequireResolve;
    cache: any;
    extensions: NodeExtensions;
    main: NodeModule | undefined;
    context: (path: string, useSubdirectories: boolean, patter: RegExp)
        => {
            (key: string): any,
            keys(): string[],
        };
}

declare module "static/protocol.json" {
    type ProtocolToVersion = {
        [protocol: string]: string[];
    };
    const protocolToVersion: ProtocolToVersion;
    export = protocolToVersion;
}

declare module "universal/utils/packFormatMapping.json" {
    type PackFormatToVersioRange = {
        [range: string]: string;
    };
    const formatToRange: PackFormatToVersioRange;
    export = formatToRange;
}

declare module NodeJS {
    interface Global {
        __static: string;
    }
}

declare var __static: string;

declare module 'locales' {
    const locales: object;
    export default locales;
}

declare module 'fast-html-parser' {
    interface Node {
        text: string;
        rawText: string;
        structuredText: string;

        firstChild: Node;
        lastChild: Node;
        childNodes: Node[];

        removeWhitespace(): Node;
        trimRight(): Node;

        attributes: { [key: string]: string };
        rawAttributes: string;
        rawAttrs: string;
        tagName: string;
        id: string;
        classNames: string[];

        querySelectorAll(selector: string): Node[];
        querySelector(selector: string): Node;
    }
    class TextNode implements Node {
        public readonly text: string;
        public readonly rawText: string;
        public readonly structuredText: string;
        public readonly firstChild: Node;
        public readonly lastChild: Node;
        public readonly childNodes: Node[];
        public readonly attributes: { [key: string]: string };
        public readonly rawAttributes: string;
        public readonly rawAttrs: string;
        public readonly tagName: string;
        public readonly id: string;
        public readonly classNames: string[];

        public removeWhitespace(): TextNode;
        public trimRight(): TextNode;
        public querySelectorAll(selector: string): TextNode[];
        public querySelector(selector: string): TextNode;
    }
    class HTMLElement implements Node {
        public readonly text: string;
        public readonly rawText: string;
        public readonly structuredText: string;
        public readonly firstChild: Node;
        public readonly lastChild: Node;
        public readonly childNodes: Node[];
        public readonly attributes: { [key: string]: string };
        public readonly rawAttributes: string;
        public readonly rawAttrs: string;
        public readonly tagName: string;
        public readonly id: string;
        public readonly classNames: string[];

        public querySelectorAll(selector: string): Node[];
        public querySelector(selector: string): Node;

        public removeWhitespace(): HTMLElement;
        public trimRight(): HTMLElement;
    }

    function parse(raw: string, options?: {
        lowerCaseTagName?: false,  // convert tag name to lower case (hurt performance heavily)
        script?: false,            // retrieve content in <script> (hurt performance slightly)
        style?: false,             // retrieve content in <style> (hurt performance slightly)
        pre?: false,
    }): HTMLElement;
}

