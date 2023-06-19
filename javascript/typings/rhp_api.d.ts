declare namespace IRP {

    export interface Attribute extends Variable {
        getIsStatic():number
        getOwner():Classifier;
    }

    export interface Argument {
		getName(): unknown;
        getOwner():Operation;
    }

    export interface Class extends Classifier {

    }

    export interface Classifier extends Unit {
		getInterfaceItems(): Collection<InterfaceItem>;
        getOperations():Collection<Operation>;
        getPorts():Collection<Port>
    }

    export interface Collection<EleType> {
        getCount(): number;
        getItem(i:number):EleType;
        toList(): Java.List<EleType>;
    }

    export interface InterfaceItem extends Classifier {
        getArguments():Collection<Argument>;
    }

    export interface EnumerationLiteral extends ModelElement {
        getValue(): String
    }

    export interface Event extends InterfaceItem {
        getOwner():Package;
    }

    export interface EventReception extends Classifier {
        getEvent(): Event;
    }

    export interface Instance extends Relation {
        getOwner(): Package;
    }

    export interface Link extends Unit {
        getFrom(): Instance;
        getFromPort(): Port;
        getTo(): Instance;
        getToPort(): Port;
    }

    export interface ModelElement {
		getAttributes(): unknown;
		getEvent(): unknown;
		getFromElement(): unknown;
		getFromPort(): unknown;
		getProvidedInterfaces(): unknown;
		getRequiredInterfaces(): unknown;
		getToElement(): unknown;
		getToPort(): any;
		getType(): unknown;
        getMetaClass(): Java.String;
        getName():Java.String;
        getOwner():ModelElement;
        getStereotypes():Collection<Stereotype>;
        getTag(name:string):any;
        getUserDefinedMetaClass():Java.String;
    }

    export interface Operation extends InterfaceItem {
        getOwner(): Class
    }

    export interface Package extends ModelElement {
		getElement(): unknown;
        getClasses():Collection<Classifier>;
        getLinks():Collection<Link>;
    }

    export interface Port extends ModelElement {
        getOwner(): Class;
        getProvidedInterfaces():Collection<Class>;
        getRequiredInterfaces():Collection<Class>;

    }

    export interface Relation extends Unit {

    }

    export interface Stereotype extends Classifier {

    }

    export interface Type extends Classifier {
        isKindEnumeration(): number
        getEnumerationLiterals(): Collection<EnumerationLiteral>
    }

    export interface Unit extends ModelElement {

    }

    export interface Variable extends Unit {

    }
    
}

declare namespace Java {
    export interface String extends string {
        equals(other:string):boolean;
        endsWith(other:string):boolean;
    }
    export interface List<E> {
        isEmpty():boolean;
    } 
}