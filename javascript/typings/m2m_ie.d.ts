declare namespace mapRhp2MDWElements {
    function get(element: IRP.ModelElement): any;
}
declare namespace mapMDW2RhpElements {
    function get(element: any): IRP.ModelElement;
}

declare namespace model {
    function create(name: string):any;
}

declare namespace logger {
    function severe(msg: string);
    function warning(msg: string);
    function info(msg: string);
}

