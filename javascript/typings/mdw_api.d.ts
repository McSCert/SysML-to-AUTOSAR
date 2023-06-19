declare namespace MDW {

    export interface ApplicationSwComponentType extends Element {

    }

    export interface Argument extends Element {

    }

    export interface ARPackage extends Element {

    }

    export interface AssemblySwConnector extends Element {

    }

    export interface CompositionSwComponentType extends Element {

    }

    export interface Element {
        eContainer(): Element;
    }

    export interface Identifier {
        getValue(): string;
        setValue(value: string);
    }

    export interface ParameterDataPrototype extends Referrable {

    }

    export interface RunnableEntity extends Element {

    }

    export interface SenderReceiverInterface extends Element {

    }

    export interface SwcInternalBehavior extends Element {

    }

    export interface VariableDataPrototype extends Element {

    }

    export interface RPortPrototype extends Element {
		setRequiredInterface(mdwReqIntr: any): unknown;
		getRequiredComSpec(): unknown;
    }

    export interface PPortPrototype extends Element {
		setProvidedInterface(mdwPrvIntr: any): unknown;
		getProvidedComSpec(): unknown;
		getName(): unknown;
    }

    export interface PortInterface extends Element {

    }

    export interface Referrable extends Element {
        getShortName(): Identifier;
    }

    export interface VariableAcess extends Referrable {

    }
}
