/** === Start Conditions === **/

/**
 * Applied to a IRP.Port to determine if it should be transformed into an
 * MDW.PPortProtype.
 * 
 * To be transformed, the SysML:Port must either be:
 * - Server: Provide a ClientServer interface
 * - Sender: Require a SenderReceiver interface
 * 
 * @param {IRP.Port} port the port
 * @returns {boolean} true, if the Port should be transformed
 * @todo Can blocks both provide and require interfaces? If so, this needs to be 
 * a 1-to-many, as we would require one MDW.PPortProtype per interface type
 */
function ceProvidedPort(port) {
	var rhpReqInts = port.getRequiredInterfaces().toList();
	var rhpProInts = port.getProvidedInterfaces().toList();
	if (!rhpProInts.isEmpty() && rhpReqInts.isEmpty()) {
		if (ceIsClientServerInterface(rhpProInts[0])) {
			logger.info("ceProvidedPort - IRP.Port " + port.getName()+ " is a Server port.");
			return true; 
		}
	} else if(rhpProInts.isEmpty() && !rhpReqInts.isEmpty()) {
		if (ceIsSenderReceiverInterface(rhpReqInts[0])) {
			logger.info("ceProvidedPort - IRP.Port " + port.getName()+ " is a Sender port.");
			return true;  
		}
	} else {
		logger.warning("ceProvidedPort - Port with no interface!");
	}
	return false;
}

/**
 * Applied to a IRP.Port to determine if it should be transformed into an
 * MDW.PPortProtype.
 * 
 * To be transformed, the SysML:Port must either be:
 * - Client: Require a ClientServer interface
 * - Receiver: Provice a SenderReceiver interface
 *
 * @param {IRP.Port} port
 * @returns {boolean} true, if the Port should be transformed
 * @todo Can blocks both provide and require interfaces? If so, this needs to be 
 * a 1-to-many, as we would require one MDW.PPortProtype per interface type
 */
function ceRequiredPort(port) {
	var rhpProInts = port.getProvidedInterfaces().toList();
	var rhpReqInts = port.getRequiredInterfaces().toList();
	if(!rhpProInts.isEmpty() && rhpReqInts.isEmpty()) {
		if (ceIsSenderReceiverInterface(rhpProInts[0])) {
			logger.info("ceRequiredPort - IRP.Port " + port.getName()+ " is a Receiver port.");
			return true; 
		}
	} else if(!rhpReqInts.isEmpty() && rhpProInts.isEmpty()){
		if (ceIsClientServerInterface(rhpReqInts[0])) {
			logger.info("ceRequiredPort - IRP.Port " + port.getName()+ " is a Client port.");
			return true;
		}
	} else {
	logger.warning("ceRequiredPort -  Port with No interface!");
	}
	return false;
}

/**
 * Applied to an Interface (IRP.Classifier) to determine if it should be
 * transformed into a MDW.SenderReceiverInterface.
 *
 * All operations in the interface should be either «operationWdata»
 * or «reception».
 * 
 * @param {IRP.Classifier} interface
 * @returns {boolean} true, if the Interface should be transformed.
 */
function ceIsSenderReceiverInterface(interface){
	var opIsSRType = 0;
	var rhpIntItems = interface.getInterfaceItems();
	for (var i=1; i<=rhpIntItems.getCount(); i++) {
		var rhpIntItem = rhpIntItems.getItem(i);
		if (isOperationWData(rhpIntItem) 
				|| rhpIntItem.getMetaClass().equals("EventReception")) {
			opIsSRType += 1;
		}
			
	}
	if (opIsSRType == rhpIntItems.getCount()) {
		return true;
	} else if (opIsSRType > 0) {
		logger.severe("ceIsSenderReceiverInterface - The interface "+ interface.getName() +
		"  should only contain «operationWdata»\
		   or «reception». Please check the interface definition.");
	}
	return false;
}

/**
 * Applied to an Interface (IRP.Classifier) to determine if it should be
 * transformed into a MDW.ClientServerInterface.
 *
 * Only operations with «operationWevent» belong to ClientServerIterface.
 * 
 * @param {IRP.Classifier} interface
 * @returns {boolean} true, if the Interface should be transformed.
 */
function ceIsClientServerInterface(interface){
	var opIsCSType = true;
	var rhpIntItems = interface.getInterfaceItems();
	for (var i=1; i<=rhpIntItems.getCount(); i++) {
		var rhpIntItem = rhpIntItems.getItem(i);
		if (!isOperationWevent(rhpIntItem)) {
			opIsCSType = false;
			break;
		}
	}
	return opIsCSType;
}

/**
 * Applied to an IRP.Event to determine if it should be transformed into an
 * MDW.OperationInvokedEvent.
 *
 * Only events that are used as 'events' in «operationWevent» Opereations.
 * This function naviagtes to the event's package and searches for all
 * «operationWevent» Opereations inside the pacakges's blocks that have a
 * reference to the Event in the 'event' tag.
 *
 * @param {IRP.Event} event
 * @returns {boolean} true, if the Event should be transformed
 */
function ceIsEventforOperationWithEvent(event) {
	var objOperationAndPort = findOpWEvntForEvent(event, false);
   	return isNotNull(objOperationAndPort.operation);
}

/**
 * Applied to an IRP.Reception to determine if it should be transformed into an
 * MDW.OperationInvokedEvent.
 *
 * Only events that are used as 'events' in «operationWevent» Opereations.
 * This function naviagtes to the event's package and searches for all
 * «operationWevent» Opereations inside the pacakges's blocks that have a
 * reference to the Event in the 'event' tag.
 *
 * @param {IRP.EventReception} reception
 * @returns {boolean} true, if the Event should be transformed
 */
function ceIsNotEventforOperationWithEvent(reception) {
	return !ceIsEventforOperationWithEvent(reception.getEvent());
}

/**
 * Applied to an IRP.Event to determine if it should be transformed into separate
 * MDW.DataElements for its arguments.
 *
 * @param {IRP.Event} event
 * @returns {boolean} true, if the Event should be transformed
 */
function ceIsEventWithParameter(event) {
	return event.getArguments().getCount() > 0;
}

/**
 * Applied to an IRP.Attribute to determine if it should be transformed into an
 * MDW.InterRunnableVariable.
 * 
 * Only attributes that are static are transformed, iff their owner is a Block.
 *
 * @param {IRP.Attribute} attribute
 * @returns {boolean} true, if the Attribute should be transformed
 */
function ceIsStaticAttribute(attribute) {
	return attribute.getIsStatic() == 1
			&& attribute.getOwner().getUserDefinedMetaClass().equals("SoftwareComponent");
}

/**
 * Applied to an IRP.Argument to determine if it should be transformed into an
 * MDW.ArgumentDataPrototype.
 * 
 * Only operations arguments in client-server interfaces should be transformed. 
 *
 * @param {IRP.Argument} argument
 * @returns {boolean} true, if the Argument should be transformed
 */
function ceIsCSOperationArgument(argument) {
	var rhpOwner = argument.getOwner();
	if (rhpOwner.getUserDefinedMetaClass().equals("Operation")) {
		var rhpOpOwner = rhpOwner.getOwner();
		//logger.info("=============" + element.getName()+ "parent " + rhpOpOwner.getUserDefinedMetaClass());
		if (rhpOpOwner.getUserDefinedMetaClass().equals("Interface")) {
			//logger.info("ceIsOperationArgument - Argument"+ argument.getName() + " Argument Owner: " + rhpOwner.getName()+" Owner's Parent "+ rhpOpOwner.getUserDefinedMetaClass());
			return ceIsClientServerInterface(rhpOpOwner);
		}
	}
	return false;
}

/**
 * Applied to an IRP.Argument to determine if it should be transformed into an
 * MDW.ArgumentDataPrototype.
 * 
 * Only operations arguments in sender-receiver interfaces should be transformed. 
 *
 * @param {IRP.Argument} argument
 * @returns {boolean} true, if the Argument should be transformed
 */
function ceIsSROperationArgument(argument) {
	var rhpOwner = argument.getOwner();
	//logger.info("ceIsSROperationArgument - rhpOwner : " + rhpOwner.getUserDefinedMetaClass() + " of element " + argument.getName());
	if (rhpOwner.getUserDefinedMetaClass().equals("Operation")) {
		var rhpOpOwner = rhpOwner.getOwner();
		if (rhpOpOwner.getUserDefinedMetaClass().equals("Interface") ) {
			//logger.info("ceIsOperationArgument - Argument"+ argument.getName() + " Argument Owner: " + rhpOwner.getName()+" Owner's Parent "+ rhpOpOwner.getUserDefinedMetaClass());
			return ceIsSenderReceiverInterface(rhpOpOwner);
		}
	}else if (rhpOwner.getUserDefinedMetaClass().equals("Event")){
		var rhpPkg =  rhpOwner.getOwner();
		var rhpClasses = rhpPkg.getClasses();
		for (var i = 1; i<= rhpClasses.getCount(); i++){
			if (rhpClasses.getItem(i).getUserDefinedMetaClass().equals("Interface")){
				var rhpInt = rhpClasses.getItem(i);
				var rhpOps = rhpInt.getInterfaceItems();
				for(var j=1; j <= rhpOps.getCount(); j++){
					var rhpOp = rhpOps.getItem(j);
					if (rhpOp.getMetaClass().equals("EventReception") &&  rhpOp.getEvent().getName().equals(rhpOwner.getName())){
						return ceIsSenderReceiverInterface(rhpInt);
					}
				}
			}
		}
	}
	return false;
}

/**
 * Applied to an IRP.Operation to determine if if should be transformed into an
 * MDW.RunnableEntity
 *
 * Only operations in SoftwareComponents should be transformed.
 *
 * @param {IRP.Operation} operation
 * @returns {boolean} true, if the Operation should be transformed
 */
function ceOwnerIsSwComp(operation) {
    return operation.getOwner().getUserDefinedMetaClass().equals("SoftwareComponent");
}


/**
* Check if the IRP.Operation is contained in an interface.

* @param {IRP.Operation} operation
* @returns {boolean} if true, then the operation should be transformed
*/
function ceOwnerIsInterface(operation){
	return operation.getOwner().getUserDefinedMetaClass().equals("Interface");
}

/**
*
* Check if the Object (IRP.Instance) is used in a link.
*
* Visits all links in the Object owner (Block) and checks if the element is either
* the source (fromElement) or target (toElement) of the Link.

* @param {IRP.Instance} object
* @returns {boolean} true, if the element is used in a link
*/
function ceIsUsedInLink(object){
	var rhpPkg = object.getOwner();
	var rhpLinks = rhpPkg.getLinks();
	for (var i=1; i<=rhpLinks.getCount(); i++) {
		var rhpLink = rhpLinks.getItem(i);
		var rhpToEl = rhpLink.getTo();
		if (rhpToEl.getName() == object.getName()) {
			return true;
		}
		var rhpFromEl = rhpLink.getFrom();
		if (rhpFromEl.getName() == object.getName()) {
			return true;
		}
	}
	return false;
}

/** === End Conditions === **/


/** === Start Context === **/

/**
 * For operations that become Runnables, we need to create the SwcInternalBehavior
 * that holds the runnable. The SwcInternalBehavior should be contained in the
 * operation's owner equivalent (MDW).
 *
 * If the opearation's owner is not transformed, then the SwcInternalBehavior is
 * not created. If the opearation's owner is transformed, the function returns
 * the existing SwcInternalBehavior or creates a new one.
 *
 * @param {MDW.RunnableEntity} mdwRunnableEntity
 * @returns {MDW.SwcInternalBehavior} The SwcInternalBehavior where the
 * RunnableEntity should be added. Null if the operation's owner is not transformed.
 **/
function nceSWCInternalBhv(mdwRunnableEntity) {
 	var rhpOp = mapMDW2RhpElements.get(mdwRunnableEntity);
	var rhpSwc = rhpOp.getOwner();
	var mdwOwner = mapRhp2MDWElements.get(rhpSwc);
	if (mdwOwner!=null) {
		var size = mdwOwner.getInternalBehavior().size();
		var ib = null;
		if (size > 0) {
			ib = mdwOwner.getInternalBehavior().get(0);
		} else {
			ib = createInternalBehavior(rhpOp.getName());
			mdwOwner.getInternalBehavior().add(ib);
		}
		return ib;
	}
	return null;
}

/**
 * For Interfaces that become CSI or SRI, we need to create the Interface package
 * that holds all interfaces. Additionally, the SoftwareTypes Package is also created.
 *
 * @param {MDW.PortInterface} mdwPortInterface
 * @returns {MDW.ARPackage} The Package where the CSI or SRI should be added.
 * 
 **/
function nceAddInterfacePackageHierarchy(mdwPortInterface) {
	return addSWCPackageHierarchy(mdwPortInterface, "Interfaces");
}

/**
 * For Blocks that become ApplicationSwComponentTypes, we need to create the
 * ComponentTypes pacakge hierarchy.
 * 
 * @param {MDW.ApplicationSwComponentType} mdwAppSwCType
 * @returns {MDW.ARPackage} The ARpackage where the
 * element should be added.
 **/
function nceAddSWCPackageHierarchy(mdwAppSwCType) {
	return addSWCPackageHierarchy(mdwAppSwCType, "ComponentTypes");
}

/**
 * For arrtibbutes that become VariableDataPrototype, we need to create the SenderReceiverInterface
 * that holds the VariableDataPrototype. The SenderReceiverInterface should be contained in the
 * attribute's owner's owner package equivalent AR-Package.
 *
 * If the attribute's owner's owner is not transformed, then the SenderReceiverInterface is
 * not created.
 *
 * @param {MDW.VariableDataPrototype} mdwVarDataProt
 * @returns {MDW.SenderReceiverInterface} The SenderReceiverInterface where the
 * VariableDataPrototype should be added. Null if the attribute's owner's owner is not transformed.
 **/
function nceSRInterface(mdwVarDataProt) {
 	var rhpAttr = mapMDW2RhpElements.get(mdwVarDataProt);
	var rhpBlk = rhpAttr.getOwner();
	var rhpPkg = rhpBlk.getOwner();
	var mdwPkg = mapRhp2MDWElements.get(rhpPkg);
	if (mdwPkg != null) {
		var inter = model.create("SenderReceiverInterface");
		var identifier = model.create("Identifier");
		identifier.setValue("SRI_"+rhpBlk.getName());
		inter.setShortName(identifier);
		mdwPkg.getElement().add(inter);
		return inter;
	}
	return null;
}

// FIXME Do we still need this?
function nceTriggerInterface(element){
	/* var rhpEvent = mapMDW2RhpElements.get(element);
	var rhpPkg = rhpEvent.getOwner();
	var mdwPkg = mapRhp2MDWElements.get(rhpPkg);
	if(mdwPkg!=null){
		var inter = model.create("TriggerInterface");
		var identifier = model.create("Identifier");
		identifier.setValue(rhpEvent.getName()+"Interface");
		inter.setShortName(identifier);
		mdwPkg.getElement().add(inter);
		return inter;
	}            */
	return null;

}

/**
* Create CompositionSwComponentType for AssemblySwConnector
* @param {MDW.AssemblySwConnector} mdwAssSwConn
* @returns {MDW.CompositionSwComponentType} 
*/
function nceAddCompositionSwCompType(mdwAssSwConn){
	var rhpCon = mapMDW2RhpElements.get(mdwAssSwConn);
	var rhpPort = rhpCon.getFromPort();
	var rhpBlk = rhpPort.getOwner();
	//logger.info("nceAddCompositionSwCompType - rhpCon "+ rhpCon.getName()+ " rhpBlk " + rhpBlk.getName());
	var mdwAppSwComp = mapRhp2MDWElements.get(rhpBlk);
	var mdwCompTypesPkg = mdwAppSwComp.eContainer();
	var mdwElements = mdwCompTypesPkg.getElement();
	for (var i= 0; i<mdwElements.size(); i++) {
		var mdwEl = mdwElements.get(i);
		if (mdwEl.getShortName().getValue() == rhpBlk.getName()+"_Cmpstn") {
			return mdwEl;			
		}
	}
	var mdwCompoSwCompType = createElementWithName("CompositionSwComponentType", rhpBlk.getName()+"_Cmpstn");
	mdwCompTypesPkg.getElement().add(mdwCompoSwCompType);
	return mdwCompoSwCompType;			
}


/**
* Create ApplicationDatatType AR-Package if it does not exist.
* @param {MDW.AppDatatType} mdwAppDataType
* @returns {MDW.ARPackage} The Package where the ApplicationDatatTypes should be added.
*/
function nceAddAppDataTypePackageHeirarchy(mdwAppDataType){
	return addARPackageHierarchy(mdwAppDataType, "DataTypes", "ApplicationDataTypes");
}



/** === End Context === **/

/** === Start Post-processing  === **/

/**
 * Add the addtional elements required by RPortProtoypes
 *
 * @param {MDW.RPortPrototype} mdwRPortPrt
 */
function ppeAddRPortStructure(mdwRPortPrt) {
	var rhpPort = mapMDW2RhpElements.get(mdwRPortPrt);
	//logger.info("ppeAddRPortStructure - Port: " + rhpPort.getName());
	var rhpProInts = rhpPort.getProvidedInterfaces().toList();
	var rhpReqInts = rhpPort.getRequiredInterfaces().toList();
	if(!rhpProInts.isEmpty() && rhpReqInts.isEmpty()){
		var rhpPrvIntr = rhpProInts[0]
		if (ceIsSenderReceiverInterface(rhpPrvIntr)) { //receiver
			var rhpBlk = rhpPort.getOwner();
			var rhpPkg = rhpBlk.getOwner();
			var rhpClasses = rhpPkg.getClasses();
			var mdwAppSwComp = mapRhp2MDWElements.get(rhpBlk);
			var mdwSWIntBeh = mdwAppSwComp.getInternalBehavior().get(0);
			var mdwPrvIntr = mapRhp2MDWElements.get(rhpPrvIntr);;
			if (isNull(mdwPrvIntr)) {
				logger.severe("ppeAddRPortStructure - No target SenderReceiverInterface found for interface " + rhpPrvIntr.getName());
				return;
			}
			//Set the Port Prototype Interface
			mdwRPortPrt.setRequiredInterface(mdwPrvIntr);
			var rhpIntItems = rhpPrvIntr.getInterfaceItems();
			for (var i=1; i<=rhpIntItems.getCount(); i++) {
				var rhpIntItem = rhpIntItems.getItem(i);
				//logger.info("ppeAddRPortStructure - Operation name: " + rhpIntItem.getName());
				var mdwNonQReceiverComSpec = model.create("NonqueuedReceiverComSpec");
				mdwRPortPrt.getRequiredComSpec().add(mdwNonQReceiverComSpec);
				//TODO: How to specify a correct type of ValueSpecification?
				var mdwValSpec = model.create("NumericalValueSpecification");
				mdwNonQReceiverComSpec.setInitValue(mdwValSpec);

				var mdwVariableDataProtoype = mapRhp2MDWElements.get(rhpIntItem);
				mdwNonQReceiverComSpec.setDataElement(mdwVariableDataProtoype);
				// TODO: How to add DataReceivedEvent for each argument?
				//logger.info("ppeAddRPortStructure - block " + rhpBlk.getName());
				var mdwRunEnt = createRunnableEntity(rhpIntItem.getName());
				mdwSWIntBeh.getRunnable().add(mdwRunEnt);
				
				for (var j=1; j<=rhpClasses.getCount(); j++) {
					var rhpCls = rhpClasses.getItem(j);
					if (rhpCls.getUserDefinedMetaClass().equals("SoftwareComponent")) {
						var rhpPorts = rhpCls.getPorts();
						for (var k=1; k<=rhpPorts.getCount(); k++) {
							var rhpBlkPort = rhpPorts.getItem(k);
							var rhpPortInts = rhpBlkPort.getRequiredInterfaces();
							for (var l=1; l<= rhpPortInts.getCount(); l++) {
								var rhpPortInt = rhpPortInts.getItem(l);
								if (rhpPortInt.getName()==rhpPrvIntr.getName()) {
									var mdwDataReceEvnt = createElementWithName("DataReceivedEvent", "DR_" + rhpIntItem.getName());
									mdwSWIntBeh.getEvent().add(mdwDataReceEvnt);
									var mdwVarRef = model.create("RVariableInAtomicSwcInstanceRef");					
									mdwVarRef.setContextRPort(mdwRPortPrt);
									mdwVarRef.setTargetDataElement(mdwVariableDataProtoype);  
									mdwDataReceEvnt.setData(mdwVarRef); 
									mdwDataReceEvnt.setStartOnEvent(mdwRunEnt);
									//logger.info("ppeAddRPortStructure - checking dataReceivedEvant");
									
									var mdwVariAccessDR = createElementWithName("VariableAccess", "DR_" + rhpIntItem.getName());
									mdwRunEnt.getDataReadAccess().add(mdwVariAccessDR);
									var mdwAutosarVarRef = model.create("AutosarVariableRef");
									mdwVariAccessDR.setAccessedVariable(mdwAutosarVarRef);
									var mdwVarRef = model.create("VariableInAtomicSWCTypeInstanceRef");
									mdwVarRef.setPortPrototype(mdwRPortPrt);
									mdwVarRef.setTargetDataPrototype(mdwVariableDataProtoype);
									mdwAutosarVarRef.setAutosarVariable(mdwVarRef);
									
									var rhpArgs = rhpIntItem.getArguments();
									for (var m=1; m<=rhpArgs.getCount(); m++) {
										var rhpArg = rhpArgs.getItem(m);
										var mdwVariableDataProtoype = mapRhp2MDWElements.get(rhpArg);
										if (isNull(mdwVariableDataProtoype)) {
											logger.severe("ppeAddRPortStructure - No VariableDataPrototype Found for Argument: " + rhpArg.getName());
											continue;
										}
										var mdwDataReceEvnt = createElementWithName("DataReceivedEvent", "DR_" + rhpIntItem.getName()+ "_"+rhpArg.getName());
										mdwSWIntBeh.getEvent().add(mdwDataReceEvnt);
										mdwPrvIntr.getDataElement().add(mdwVariableDataProtoype);
										var mdwVarRef = model.create("RVariableInAtomicSwcInstanceRef");					
										mdwVarRef.setContextRPort(mdwRPortPrt);
										mdwVarRef.setTargetDataElement(mdwVariableDataProtoype); 
										mdwDataReceEvnt.setData(mdwVarRef); 
										mdwDataReceEvnt.setStartOnEvent(mdwRunEnt);
										
										var mdwVariAccessDR_Arg = createElementWithName("VariableAccess", "DR_" + rhpArg.getName());
										mdwRunEnt.getDataReadAccess().add(mdwVariAccessDR_Arg);
										var mdwAutosarVarRef = model.create("AutosarVariableRef");
										mdwVariAccessDR_Arg.setAccessedVariable(mdwAutosarVarRef);
										var mdwVarRef = model.create("VariableInAtomicSWCTypeInstanceRef");
										mdwVarRef.setPortPrototype(mdwRPortPrt);
										mdwVarRef.setTargetDataPrototype(mdwVariableDataProtoype);
										mdwAutosarVarRef.setAutosarVariable(mdwVarRef);
									}
								}
							}
						}
					}
				}
			}
		}
	} else if(!rhpReqInts.isEmpty() && rhpProInts.isEmpty()) {
		var rhpReqIntr = rhpReqInts[0];
		if(ceIsClientServerInterface(rhpReqIntr)){
			// client
			//Get the transformed Port Prototype Interface from the map
			var mdwReqIntr = mapRhp2MDWElements.get(rhpReqIntr);
			if (isNull(mdwReqIntr)) {
				logger.severe("ppeAddRPortStructure - No target SenderReceiverInterface found for interface " + rhpReqIntr.getName());
				return;
			}
			mdwRPortPrt.setRequiredInterface(mdwReqIntr);
			var rhpIntItems = rhpReqIntr.getInterfaceItems();
			var rhpBlk = rhpPort.getOwner();
			var mdwAppSwComp = mapRhp2MDWElements.get(rhpBlk);
			var mdwSWIntBeh = mdwAppSwComp.getInternalBehavior().get(0);
			for (var i=1; i<=rhpIntItems.getCount(); i++) {
				var rhpIntItem = rhpIntItems.getItem(i);
				var mdwRunEnt = createRunnableEntity(rhpPort.getName()+"_"+rhpIntItem.getName());
				mdwSWIntBeh.getRunnable().add(mdwRunEnt);
				var mdwSynSerCalPnt = createElementWithName("SynchronousServerCallPoint", "OI_OA_" + rhpIntItem.getName());
				mdwSynSerCalPnt.setTimeout(1);
				mdwRunEnt.getServerCallPoint().add(mdwSynSerCalPnt);
				var mdwOp = mapRhp2MDWElements.get(rhpIntItem);
				var mdwROpRef = model.create("ROperationInAtomicSwcInstanceRef");
				mdwROpRef.setContextRPort(mdwRPortPrt);
				mdwROpRef.setTargetRequiredOperation(mdwOp);
				mdwSynSerCalPnt.setOperation(mdwROpRef);
				var mdwClientComSpec = model.create("ClientComSpec");
				mdwRPortPrt.getRequiredComSpec().add(mdwClientComSpec);
				mdwClientComSpec.setOperation(mdwOp);
			}
		}
	}
}

/**
 * Adds the required strcuture for PPortPrototypes
 * 
 * @param {MDW.PPortPrototype} mdwRPortPrt
 */
function ppeAddPPortStructure(mdwRPortPrt) {
	var rhpPort = mapMDW2RhpElements.get(mdwRPortPrt);
	//logger.info(" ppeAddPPortStructure - Port: " + rhpPort.getName()+ ", element: " + mdwRPortPrt.eClass().getName());
	var rhpReqInts = rhpPort.getRequiredInterfaces().toList();
	var rhpProInts = rhpPort.getProvidedInterfaces().toList();

	if (!rhpProInts.isEmpty() && rhpReqInts.isEmpty()) {
		if (ceIsClientServerInterface(rhpProInts[0])) {
			var rhpBlk = rhpPort.getOwner();
			var rhpPkg = rhpBlk.getOwner();
			var rhpClasses = rhpPkg.getClasses();
			var mdwAppSwComp = mapRhp2MDWElements.get(rhpBlk);
			var mdwSWIntBeh = mdwAppSwComp.getInternalBehavior().get(0);
			var rhpPrvIntr = rhpProInts[0];
			var mdwPrvIntr = mapRhp2MDWElements.get(rhpPrvIntr);
			if (isNull(mdwPrvIntr)) {
				logger.severe("ppeAddPPortStructure - No target ClientServerInterface found for interface " + rhpPrvIntr.getName());
				return;
			}
			//Set the Port Prototype Interface
			mdwRPortPrt.setProvidedInterface(mdwPrvIntr);
			var rhpIntItems = rhpPrvIntr.getInterfaceItems();
			for (var i =1; i<= rhpIntItems.getCount(); i++) {
				var rhpOp = rhpIntItems.getItem(i);
				var mdwCSOperation = mapRhp2MDWElements.get(rhpOp);
				var mdwServerComSpec = model.create("ServerComSpec");
				mdwRPortPrt.getProvidedComSpec().add(mdwServerComSpec);
				mdwServerComSpec.setOperation(mdwCSOperation);
			}
		}
	} else if(rhpProInts.isEmpty() && !rhpReqInts.isEmpty()) {
		var rhpReqIntr = rhpReqInts[0];
		if(ceIsSenderReceiverInterface(rhpReqIntr)){
			//Get the transformed PortPrototype Interface from the map
			var mdwReqIntr = mapRhp2MDWElements.get(rhpReqIntr);
			if (isNull(mdwReqIntr)) {
				logger.severe("ppeAddPPortStructure - No target SenderReceiverInterface found for interface " + rhpReqIntr.getName());
				return;
			}
			mdwRPortPrt.setProvidedInterface(mdwReqIntr);
			var rhpIntItems = rhpReqIntr.getInterfaceItems();
			var rhpBlk = rhpPort.getOwner();
			var mdwAppSwComp = mapRhp2MDWElements.get(rhpBlk);
			var mdwSWIntBeh = mdwAppSwComp.getInternalBehavior().get(0);		
			for (var i = 1; i<=rhpIntItems.getCount(); i++) {
				var rhpIntItem = rhpIntItems.getItem(i);
				var mdwVariableDataProtoype = mapRhp2MDWElements.get(rhpIntItem);
				if (isNull(mdwVariableDataProtoype)) {
					logger.severe("ppeAddPPortStructure - No VariableDataPrototype Found for Operation: " + rhpIntItem.getName());
					continue;
				}
				var mdwNonQSenderComSpec = model.create("NonqueuedSenderComSpec");
				mdwRPortPrt.getProvidedComSpec().add(mdwNonQSenderComSpec);
				mdwNonQSenderComSpec.setDataElement(mdwVariableDataProtoype);
				//TODO: How to specify a correct type of ValueSpecification?
				var mdwValSpec = model.create("NumericalValueSpecification");
				//TODO: Add HandleOutOfRange, once the "enum" problem is fixed.
				mdwNonQSenderComSpec.setInitValue(mdwValSpec);

				var mdwRunEnt = createRunnableEntity(rhpPort.getName()+"_"+rhpIntItem.getName());		
				mdwSWIntBeh.getRunnable().add(mdwRunEnt); 

				var mdwVariAccessDS = createElementWithName("VariableAccess", "DS_" + rhpIntItem.getName());
				mdwRunEnt.getDataSendPoint().add(mdwVariAccessDS);
				var mdwAutosarVarRef = model.create("AutosarVariableRef");
				mdwVariAccessDS.setAccessedVariable(mdwAutosarVarRef);
				var mdwVarRef = model.create("VariableInAtomicSWCTypeInstanceRef");
				mdwVarRef.setPortPrototype(mdwRPortPrt);
				mdwVarRef.setTargetDataPrototype(mdwVariableDataProtoype);
				mdwAutosarVarRef.setAutosarVariable(mdwVarRef);
				
				if (rhpIntItem.getMetaClass().equals("EventReception")) {				
					//for all argument inside an event, we need to add VariableAccess
					var rhpEvent  = rhpIntItem.getEvent();
					var rhpArgs = rhpEvent.getArguments();
					for (var j=1; j<=rhpArgs.getCount(); j++) {
						var rhpArg = rhpArgs.getItem(j);
						var mdwVariableDataProtoype = mapRhp2MDWElements.get(rhpArg);
						if (isNull(mdwVariableDataProtoype)) {
							logger.severe("ppeAddPPortStructure - No VariableDataPrototype Found for Argument: " + rhpArg.getName());
							continue;
						}
						var mdwVariAccessDS_Arg = createElementWithName("VariableAccess", "DS_" + rhpArg.getName());
						mdwRunEnt.getDataSendPoint().add(mdwVariAccessDS_Arg);

						var mdwAutosarVarRef = model.create("AutosarVariableRef");
						mdwVariAccessDS_Arg.setAccessedVariable(mdwAutosarVarRef);

						var mdwVarRef = model.create("VariableInAtomicSWCTypeInstanceRef");
						mdwVarRef.setPortPrototype(mdwRPortPrt);
						mdwVarRef.setTargetDataPrototype(mdwVariableDataProtoype);
						mdwAutosarVarRef.setAutosarVariable(mdwVarRef);
					}
				}
			}
		}
	}
}

/**
* 
* @param {MDW.Argument} mdwArgument
*/
function ppeAddTypeAndDirectionOfArgument(mdwArgument) {
	var rhpArg = mapMDW2RhpElements.get(mdwArgument);
	if (isNull(rhpArg)) {
		return;
	}
	//find the type for the ArgumentDataProtoypes
	var rhpArgType = rhpArg.getType();
	var mdwImplDataType = mapRhp2MDWElements.get(rhpArgType);
	if (isNotNull(mdwImplDataType)) {
		//set type
		mdwArgument.setType(mdwImplDataType);
	}
	else {
		logger.warning("ppeAddTypeAndDirectionOfArgument - No ImplementationDataType Found for " 
				+ rhpArgType.getName() + " in " + rhpArg.getName());
	}
	// TODO Get the correct path! M2M Sample page 14
	//var argDirectionEnum = Java.type('com.ibm.rational.rhapsody.metamodel.autosar00045.ArgumentDirectionEnum');
	/* var rpArgumentDirection = rhpArgu.getArgumentDirection();
	//Get the Correct Field
	var direction;
	switch(rpArgumentDirection) {
	   case "In":
			direction = argDirectionEnum.IN;
			break;
	   case "Out":
			direction = argDirectionEnum.OUT;
			break;
	   case "InOut":
			direction = argDirectionEnum.INOUT;
			break;
  }
	//Set the Argument Direction on the ArgumentdataPrototype
	element.setDirection(direction);   */
}

/**
* Change the name of PIM and add it to SwCInternalBehavior
* @param {MDW.PerInstanceMemory} mdwPerInstanceMem
*/
function ppeAddPerInstanceMemory(mdwPerInstanceMem){
 	var mdwSwInternalBeh = mdwPerInstanceMem.eContainer();
	if (isNull(mdwSwInternalBeh)) {
		logger.warning("ppeAddPerInstanceMemory - No SwcInternalBehavior Found for: " + mdwPerInstanceMem.getShortName().getValue() );
		return;
	}
	mdwPerInstanceMem.getShortName().setValue(mdwPerInstanceMem.getShortName().getValue() + "_NV");
	//logger.info("ppeAddPerInstanceMemory - element: " + mdwPerInstanceMem.getShortName().getValue());

	mdwSwInternalBeh.getPerInstanceMemory().add(mdwPerInstanceMem);
	var  props = createSwDataDefProps();
	var mdwSwDataDefProps = props[0];
	var mdwDataDefPropsCond = props[1];
	mdwPerInstanceMem.setSwDataDefProps(mdwSwDataDefProps);
	var rhpPim = mapMDW2RhpElements.get(mdwPerInstanceMem);
	var rhpType = rhpPim.getType();
	logger.info(" ppeAddPerInstanceMemory - rhpType "+ rhpType.getName());
	var mdwType = mapRhp2MDWElements.get(rhpType);
	mdwDataDefPropsCond.setValueAxisDataType(mdwType); 
}

/**
* Change the name of the Callibration property 
* @param {MDW.ParameterDataPrototype} mdwParamDataPrt
*
*/
function ppeChangeCallibrationStructure(mdwParamDataPrt){
	mdwParamDataPrt.getShortName().setValue(mdwParamDataPrt.getShortName().getValue() + "_C");
	var rhpConstant = mapMDW2RhpElements.get(mdwParamDataPrt);
	var rhpBlk = rhpConstant.getOwner();
	var mdwAppSwComp = mapRhp2MDWElements.get(rhpBlk);
	var mdwSWIntBeh = mdwAppSwComp.getInternalBehavior().get(0);
	//logger.info("ppeChangeCallibrationStructure - internal Behavior: " + mdwSWIntBeh)
	mdwSWIntBeh.getPerInstanceParameter().add(mdwParamDataPrt);
	var mdwDataProps = model.create("SwDataDefProps");
	mdwParamDataPrt.setSwDataDefProps(mdwDataProps);
	var mdwDataPropsVariant = model.create("SwDataDefPropsConditional");
	mdwDataProps.getSwDataDefPropsVariant().add(mdwDataPropsVariant);
	// Add Calibration Access and Impl Policy 
	var mdwInitVal = model.create("NumericalValueSpecification");
	var identifier = model.create("Identifier");
	identifier.setValue("Init_0");
	mdwInitVal.setShortLabel(identifier);
	//mdwInitVal.setValueValue("0");
	var mdwNumValVarPoint= model.create("NumericalValueVariationPoint");
	mdwNumValVarPoint.setMixedContentIndex(0);
	mdwInitVal.setValue(mdwNumValVarPoint);
	mdwParamDataPrt.setInitValue(mdwInitVal);
	var rhpType = rhpConstant.getType();
	var mdwType = mapRhp2MDWElements.get(rhpType);
	mdwParamDataPrt.setType(mdwType);
}

/**
 * Sets the parent (SwCInternalBehavior) and the StartOnEvent to OperationInvokedEvent
 * @param {MDW.OperationInvokedEvent} mdwOpInvkEvent
 **/
function ppeSetOperationInstanceRef(mdwOpInvkEvent) {
	var rhpEvent = mapMDW2RhpElements.get(mdwOpInvkEvent);
	var rhpPkg = rhpEvent.getOwner();
	var mdwArPkg = mapRhp2MDWElements.get(rhpPkg);
	var mdwPkges = mdwArPkg.getArPackage();
	
	for (var j=0 ; j< mdwPkges.size() ; j++) {
		var mdwArSwTypes = mdwPkges.get(j);
		if (mdwArSwTypes.getShortName().getValue() == "SoftwareTypes") {
			var mdwArSwTypesPkgs = mdwArSwTypes.getArPackage();
			for (var k=0 ; k< mdwArSwTypesPkgs.size(); k++) {
				var mdwArCompTypes = mdwArSwTypesPkgs.get(k);
				if (mdwArCompTypes.getShortName().getValue() == "ComponentTypes"){
					var mdwElements = mdwArCompTypes.getElement();
					var mdwAppSwComp;
					for (var i=0 ; i<mdwElements.size(); i++) {
						var mdwElement = mdwElements.get(i);
						if(mdwElement.eClass().getName()== "ApplicationSwComponentType") {
							if(createPOpRef(mdwElement, rhpEvent, mdwOpInvkEvent)){
								mdwAppSwComp = mdwElement;
								break;
							}
						}
					}
					if (isNull(mdwAppSwComp)) {
						logger.severe("ApplicationSwComponentType Not Found for " + rhpEvent.getName());
						return;
					}
					var mdwSwInternalBeh = mdwAppSwComp.getInternalBehavior().get(0);
					mdwSwInternalBeh.getEvent().add(mdwOpInvkEvent);
					var rhpOp = findOpWEvntImplForEvent(rhpEvent, false);
					var mdwRunnableEntity = mapRhp2MDWElements.get(rhpOp);
					mdwOpInvkEvent.setStartOnEvent(mdwRunnableEntity);
					return;
				}
			}
		}
	}
}

/**
 * Creates the DataElements needed by the Event with parameters
 * @param {MDW.VariableDataPrototype} mdwVarDataPrt
 **/
function ppeAddEventParameters(mdwVarDataPrt) {
	var rhpReception = mapMDW2RhpElements.get(mdwVarDataPrt);
	var rhpInt = rhpReception.getOwner();
	var mdwSRI = mapRhp2MDWElements.get(rhpInt);
	if (isNull(mdwSRI)) {
		logger.severe("ppeAddEventParameters - No SenderReceiverInterface Found for Rhapsody Interface:" + rhpInt.getName());
		return;
	}
	mdwSRI.getDataElement().add(mdwVarDataPrt);
	var rhpType = rhpReception.getEvent().getTag("type").getValueSpecifications().getItem(1).getValue();
	var mdwType = mapRhp2MDWElements.get(rhpType);
	mdwVarDataPrt.setType(mdwType);
}

/**
 * Set ExplicitInterRunnableVariable of the internal behavior of the block  
 * @param {MDW.VariableDataPrototype} mdwVarDataProt
 **/
function ppeSetInterRunnableVarParent(mdwVarDataProt){
	var rhpAttr = mapMDW2RhpElements.get(mdwVarDataProt);
	var rhpBlk = rhpAttr.getOwner();
	var mdwAppSwComp = mapRhp2MDWElements.get(rhpBlk);
	var mdwSWIntBeh = mdwAppSwComp.getInternalBehavior();
	mdwSWIntBeh.get(0).getExplicitInterRunnableVariable().add(mdwVarDataProt);
	var rhpType = rhpAttr.getType();
	var mdwType = mapRhp2MDWElements.get(rhpType);
	logger.info(" ppeSetInterRunnableVarParent - mdwType " + mdwType.getShortName().getValue());
	if (isNotNull(mdwType)) {
		//set type
		mdwVarDataProt.setType(mdwType);
	}
	else {
		logger.severe("ppeSetInterRunnableVarParent - No ApplicationDataType Found for " 
				+ rhpType.getName() + " in " + rhpAttr.getName());
	}
	
}


/**
* create ArPackage for ImplementationDataType. ImplementationDataType included in
* DataTypes AR package.
* 
* @param {MDW.ImplementationDataType} element
*/
/* function ppeAddDataTypesARPackage(element){
	var rhpDataType = mapMDW2RhpElements.get(element);
	var rhpPkg = rhpDataType.getOwner();
	var mdwImplDataTypes;
	var mdwBaseTypes;
	var packs = createDataTypesStructure(rhpPkg);
	mdwDataTypesPkg = packs[0];
	mdwImplDataTypes = packs[1];
	mdwBaseTypes = packs[2];
	mdwImplDataTypes.getElement().add(element);
} */

/**
*
* @param {MDW.ApplicationSwComponentType} mdwAppSwCType
*
*/
function ppeAddSwcInternalBehavior(mdwAppSwCType){
	var mdwIntBehav = createInternalBehavior(mdwAppSwCType.getShortName().getValue());
	mdwAppSwCType.getInternalBehavior().add(mdwIntBehav);
	mdwAppSwCType.getShortName().setValue(mdwAppSwCType.getShortName().getValue());
	
	var rhpBlk = mapMDW2RhpElements.get(mdwAppSwCType);
	if (isNull(rhpBlk)) {
		logger.severe("ppeAddSwcInternalBehavior - No rhpBlk found for ApplicationSwComponentType: "+ mdwAppSwCType.getShortName().getValue());
		return;
	}
		
	var rhpAttrs = rhpBlk.getAttributes();
	for (var i =1; i<=rhpAttrs.getCount(); i++) {
		var rhpAttr = rhpAttrs.getItem(i);
		if (hasStereotype(rhpAttr, "PIMProperty")) {
			var mdwPIM = mapRhp2MDWElements.get(rhpAttr);
			if (isNull(mdwPIM)) {
				logger.warning("No mdwPIM found for Attribute: "+ rhpAttr.getName());
				continue;
			}
			mdwIntBehav.getPerInstanceMemory().add(mdwPIM);
		}
	}
}

/**
* Connect RunnableEntity to its parent (SwcInternalBehavior)
*
* @param {MDW.RunnableEntity} mdwRunnableEntity
*/
function ppeSetRunnableEntityParent(mdwRunnableEntity){
	//Change the name the runnable entity
	var rhpOp = mapMDW2RhpElements.get(mdwRunnableEntity);
	var rhpPort = findProvidingPortUsingOperation(rhpOp);
	if (isNull(rhpPort)) {
		rhpPort = findRequiringPortUsingOperation(rhpOp);
	}
	if (isNull(rhpPort)) {
		logger.severe("ppeSetRunnableEntityParent - No Interface Found For Operation: " + rhpOp.getName());
		return;
	}
	if (isProvidedOpIml(rhpOp)) {
		mdwRunnableEntity.getShortName().setValue(rhpPort.getName() + "_" + rhpOp.getName());
	} 
	// Set the parent
	var rhpBlk = rhpOp.getOwner();
	var mdwAppSwComp = mapRhp2MDWElements.get(rhpBlk);	
	var mdwSwIntBeh = mdwAppSwComp.getInternalBehavior().get(0);
	mdwSwIntBeh.getRunnable().add(mdwRunnableEntity);
	completeRunnableEntity(mdwRunnableEntity)
}

/**
* Change name of VariableDataPrototype for an OperationWdata 
* Add Type to VariableDataPrototype
* @param {MDW.VariableDataPrototype} mdwVarDataPrt
*/
function ppeChangeDataPrototypeNameAndSetType(mdwVarDataPrt) {
	var rhpOp = mapMDW2RhpElements.get(mdwVarDataPrt);
	var rhpData = rhpOp.getTag("dataReceived");
	var rhpType = rhpData.getValueSpecifications().getItem(1).getValue().getType();
	var mdwType = mapRhp2MDWElements.get(rhpType);
	mdwVarDataPrt.setType(mdwType);
	mdwVarDataPrt.getShortName().setValue(rhpData.getValue() + "_" + rhpOp.getName());
}

/**
* Create SwComponentPrototype and Port references to AssemblySwConnector
* @param {MDW.AssemblySwConnector} mdwAssSwConn
*/
function ppeAddAssemblySwConStruct(mdwAssSwConn){
	var rhpLink = mapMDW2RhpElements.get(mdwAssSwConn);
	var mdwComposSwCompoType = mdwAssSwConn.eContainer();
	//set for From port
	var rhpPort = rhpLink.getFromPort();
	var rhpBlk = rhpPort.getOwner();
	var mdwSwCompType = mapRhp2MDWElements.get(rhpBlk);
	var mdwSwCompTypeList = mdwComposSwCompoType.getComponent();
	var mdwSwComProType;
	for (var i=0; i<mdwSwCompTypeList.size(); i++) {
		if (mdwSwCompTypeList.get(i).getShortName().getValue() == "CtSt_"+rhpLink.getFromElement().getName()) {
			mdwSwComProType = mdwSwCompTypeList.get(i);
			break;
		}
	}
	if (isNull(mdwSwComProType)) { 
		mdwSwComProType = createElementWithName("SwComponentPrototype", "CtSt_"+rhpLink.getFromElement().getName());
		mdwSwComProType.setType(mdwSwCompType);
		mdwComposSwCompoType.getComponent().add(mdwSwComProType);
	}
	
	var mdwPort = mapRhp2MDWElements.get(rhpPort);
	//mdwComposSwCompoType.getPort().add(mdwPort);
	if (mdwPort.eClass().getName().equals("PPortPrototype")) {
		var mdwPPortInComposRef = model.create("PPortInCompositionInstanceRef");
		mdwPPortInComposRef.setTargetPPort(mdwPort);
		mdwPPortInComposRef.setContextComponent(mdwSwComProType);
		mdwAssSwConn.setProvider(mdwPPortInComposRef);
	} else {
		var mdwRPortInComposRef = model.create("RPortInCompositionInstanceRef");
		mdwRPortInComposRef.setTargetRPort(mdwPort);
		mdwRPortInComposRef.setContextComponent(mdwSwComProType);
		mdwAssSwConn.setRequester(mdwRPortInComposRef);
	}
	// set for To port
	rhpToPort = rhpLink.getToPort();
	rhpBlk = rhpToPort.getOwner();
	mdwSwCompType = mapRhp2MDWElements.get(rhpBlk);
	mdwSwCompTypeList = mdwComposSwCompoType.getComponent();
	mdwSwComProType = null;
	for (var i=0; i<mdwSwCompTypeList.size(); i++) {
		if (mdwSwCompTypeList.get(i).getShortName().getValue() == "CtSt_"+rhpLink.getToElement().getName()){
			mdwSwComProType = mdwSwCompTypeList.get(i);
			break;
		}
	}
	if (isNull(mdwSwComProType)) { 
		mdwSwComProType = createElementWithName("SwComponentPrototype", "CtSt_"+rhpLink.getToElement().getName());
		mdwSwComProType.setType(mdwSwCompType);
		mdwComposSwCompoType.getComponent().add(mdwSwComProType);
	}
	var mdwToPort = mapRhp2MDWElements.get(rhpToPort);
	//mdwComposSwCompoType.getPort().add(mdwToPort);
	//logger.info("ppeAddAssemblySwConStruct - rhpToPort " + rhpToPort.getName());
	//logger.info("mdwToPort - " +mdwToPort.getShortName().getValue());
	if (mdwToPort.eClass().getName().equals("PPortPrototype")) {
		var mdwPPortInComposRef = model.create("PPortInCompositionInstanceRef");
		mdwPPortInComposRef.setTargetPPort(mdwToPort);
		mdwPPortInComposRef.setContextComponent(mdwSwComProType);
		mdwAssSwConn.setProvider(mdwPPortInComposRef);
		
	} else {
		var mdwRPortInComposRef = model.create("RPortInCompositionInstanceRef");
		mdwRPortInComposRef.setTargetRPort(mdwToPort);
		mdwRPortInComposRef.setContextComponent(mdwSwComProType);
		mdwAssSwConn.setRequester(mdwRPortInComposRef);
	}
}

/**
* Sets SwCInternalBehavior to TimingEvent
* Creates RunnableEntity invoked by the TimingEvent
* @param {MDW.TimingEvent} mdwTimingEvent
*/
function ppeSetTimingEventStructure(mdwTimingEvent){
	var rhpOp = mapMDW2RhpElements.get(mdwTimingEvent);
	var rhpPeriodTag = rhpOp.getTag("period").getValue();
	var rhpBlk = rhpOp.getOwner();
	var mdwAppSwComp = mapRhp2MDWElements.get(rhpBlk);
	var mdwSWIntBeh = mdwAppSwComp.getInternalBehavior().get(0);
	mdwTimingEvent.getShortName().setValue("TE_"+mdwTimingEvent.getShortName().getValue());
	mdwSWIntBeh.getEvent().add(mdwTimingEvent);
	var mdwRunEnt = createRunnableEntity(rhpOp.getName());
	mdwTimingEvent.setStartOnEvent(mdwRunEnt);
	mdwSWIntBeh.getRunnable().add(mdwRunEnt);
	if (isNull(rhpPeriodTag)) {
		logger.warning(" ppeSetTimingEventStructure - No value for 'period' in operation: " + rhpOp.getName());
		return;
	}
	mdwTimingEvent.setPeriod(rhpPeriodTag);
}
	
/**
* create sturcture for the ApplicationDataTypes.
* @param {MDW.ApplicationDataType} mdwAppDataType
*/
function ppeAddAppDataTypeStructure(mdwAppDataType)	{
	//logger.info("ppeAddAppDataTypeStructure - 1");
	mdwAppDataType.setCategory("STRING");
	//logger.info("ppeAddAppDataTypeStructure - 2");
	var rhpDataType = mapMDW2RhpElements.get(mdwAppDataType);
	logger.info("ppeAddAppDataTypeStructure - 3" + rhpDataType.getName());
	if (rhpDataType.isKindEnumeration() == 1){
		//logger.info("ppeAddAppDataTypeStructure - 4");
		var  props = createSwDataDefProps();
		var mdwSwDataDefProps = props[0];
		var mdwDataDefPropsCond = props[1];
		//logger.info("ppeAddAppDataTypeStructure - 5");
		mdwAppDataType.setSwDataDefProps(mdwSwDataDefProps);
		//logger.info("ppeAddAppDataTypeStructure - 6");
		var mdwCompuMethod = createCompuMethod(rhpDataType);
		mdwDataDefPropsCond.setCompuMethod(mdwCompuMethod);
		//logger.info("ppeAddAppDataTypeStructure - 7");
		var mdwUnit = getUnit(mdwAppDataType, "EnumUnit");
		mdwCompuMethod.setUnit(mdwUnit);
		mdwDataDefPropsCond.setUnit(mdwUnit);
	}else if (rhpDataType.isKindTypedef() == 1){
		var mdwUnitsPkg = addARPackageHierarchy(mdwAppDataType,'DataTypes', 'Units');
		var rhpUnit =  rhpDataType.getTag("unit");//.getValueSpecifications().getItem(1); 
		var mdwUnit = getUnit(mdwAppDataType, rhpUnit.getValue());
		var  props = createSwDataDefProps();
		var mdwSwDataDefProps = props[0];
		var mdwDataDefPropsCond = props[1];
		mdwAppDataType.setSwDataDefProps(mdwSwDataDefProps);
		mdwDataDefPropsCond.setUnit(mdwUnit);
	}
}

function createSwDataDefProps(){
	var mdwSwDataDefProps = model.create("SwDataDefProps");
	logger.info("createSwDataDefProps - 1");
	var mdwDataDefPropsCond = model.create("SwDataDefPropsConditional");
	mdwSwDataDefProps.getSwDataDefPropsVariant().add(mdwDataDefPropsCond);
	return [mdwSwDataDefProps, mdwDataDefPropsCond];
}

/**
* If the DataType is Enumeration, then a dummy unit "EnumUnit" is created and added.
*
*/
function getUnit(mdwAppDataType, unitName){
	var mdwPkg = addARPackageHierarchy(mdwAppDataType, "DataTypes", "Units");
	var mdwElements = mdwPkg.getElement();
	for (var i= 0; i<mdwElements.size(); i++) {
		var mdwEl = mdwElements.get(i);
		if (mdwEl.getShortName().getValue() == unitName) {
			return mdwEl;
		}
	}
	var mdwUnit = createElementWithName("Unit", unitName);
	mdwPkg.getElement().add(mdwUnit);
	return mdwUnit;
}



/** === End Post-processing  === **/

/** === Start Common  === **/

/**
 * Check if the element is not null.
 * @param {any} element
 * @returns {boolean} true, if element is not null; false otherwise
 */
function isNotNull(element) {
	if (element) {
		return true;
	} else {
		return false;
	}
}


/**
 * Check if the element is null.
 * @param {any} element
 * @returns {boolean} true, if element is null; false otherwise
 */
function isNull(element) {
	if (element) {
		return false;
	} else {
		return true;
	}

}

/**
 * Returns true if the operation has the «operationWevent» stereotype
 * @param {IRP.InterfaceItem} operation
 * @returns
 */
function isOperationWevent(operation) {
	return hasStereotype(operation, "operationWevent")
}

/**
 * Returns true if the operation has the operationWdata stereotype
 * @param {IRP.InterfaceItem} operation
 * @returns
 */
function isOperationWData(operation){
	return hasStereotype(operation, "operationWdata")
}

/**
 * Returns true if the element has the provided stereotype applied.
 * @param {IRP.ModelElement} element
 * @param {string} stereotype
 * @returns
 */
function hasStereotype(element, stereotype) {
	var stereoTypes = element.getStereotypes();
	for (var i=1;i<=stereoTypes.getCount();i++) {
		var st = stereoTypes.getItem(i);
		if (st.getName().equals(stereotype)) {
			return true;
		}
	}
	return false;
}

/**
* This finds the matching port that has a provided interface with an operation
* of the same name as the supplied rhpOp
*
* @param {IRP.Operation} rhpOp
* @returns {MDW.PPortPrototype | null} The port that uses the operation, or null
* if not found.
*/
function findProvidingPortUsingOperation(rhpOp) {
	var rhpBlock = rhpOp.getOwner();
	var rhpPorts = rhpBlock.getPorts();
	for(var i=1;i<=rhpPorts.getCount();i++) {
		var rhpPort = rhpPorts.getItem(i);
		var rphIntrs = rhpPort.getProvidedInterfaces();
			for(var j=1;j<=rphIntrs.getCount();j++) {
			var rhpIntr = rphIntrs.getItem(j);
			var rhpIntrOps = rhpIntr.getOperations();
				for(var k=1;k<=rhpIntrOps.getCount();k++) {
					var rhpIntrOp = rhpIntrOps.getItem(k);
					if (rhpOp.getName().endsWith(rhpIntrOp.getName())) {
						return rhpPort;
					}
			}
		}
	}
	return null;
}

/**
* This finds the matching port that has a required interface with an operation
* of the same name as the supplied rhpOp
*
* @param {IRP.Operation} rhpOp
* @returns {MDW.PPortPrototype | null} The port that uses the operation, or null
* if not found.
*/
function findRequiringPortUsingOperation(rhpOp) {
	var rhpBlock = rhpOp.getOwner();
	var rhpPorts = rhpBlock.getPorts();
	for(var i=1;i<=rhpPorts.getCount();i++) {
		var rhpPort = rhpPorts.getItem(i);
		var rphIntrs = rhpPort.getRequiredInterfaces();
			for(var j=1;j<=rphIntrs.getCount();j++) {
			var rhpIntr = rphIntrs.getItem(j);
			var rhpIntrOps = rhpIntr.getOperations();
				for(var k=1;k<=rhpIntrOps.getCount();k++) {
					var rhpIntrOp = rhpIntrOps.getItem(k);
					if (rhpOp.getName().endsWith(rhpIntrOp.getName())) {
						return rhpPort;
					}
			}
		}
	}
	return null;
}

/**
* Given an Event, it finds the matching «operaetionWevent» that uses the event
*
* @param {IRP.Event} rhpEvnt 
* @param {boolean} forRequired true is required, otherwise provided
* @returns { {operation: IRP.Operation, port: IRP.Port} | null} The opereation, or null if it cant be found.
*/
function findOpWEvntForEvent(rhpEvnt, forRequired) {
	var rhpPkg = rhpEvnt.getOwner();
	var rhpClss = rhpPkg.getClasses();
	for(var n=1;n<=rhpClss.getCount();n++) {
		var rhpCls = rhpClss.getItem(n);
		if(rhpCls.getUserDefinedMetaClass().equals("SoftwareComponent")) {
			var rhpPorts = rhpCls.getPorts();
			for(var i=1;i<=rhpPorts.getCount();i++) {
				var rhpPort = rhpPorts.getItem(i);
				var rphIntrs;
				if (forRequired) {
					rphIntrs = rhpPort.getRequiredInterfaces();
				} else {
					rphIntrs = rhpPort.getProvidedInterfaces();
				}
				for(var j=1;j<=rphIntrs.getCount();j++) {
					var rhpIntr = rphIntrs.getItem(j);
					var rhpIntrOps = rhpIntr.getOperations();
					for(var k=1;k<=rhpIntrOps.getCount();k++) {
						var rhpIntrOp = rhpIntrOps.getItem(k);
						if (isOperationWevent(rhpIntrOp)) {
							var evt = rhpIntrOp.getTag("event");
							if (evt.getValue() == rhpEvnt.getName()) {
								return {operation: rhpIntrOp,port: rhpPort};
							}
						}
					}
				}
			}
		}
	}
	return {operation: null,port: null};
}


function isOpImplClientServer(rhpOp, rhpCls){
	var rhpPorts = rhpCls.getPorts();
	for(var i=1;i<=rhpPorts.getCount();i++) {
		var rhpPort = rhpPorts.getItem(i);
		var rphIntrs = rhpPort.getProvidedInterfaces();
		for(var j=1;j<=rphIntrs.getCount();j++) {
			var rhpIntr = rphIntrs.getItem(j);
			var rhpIntrOps = rhpIntr.getOperations();
			for(var k=1;k<=rhpIntrOps.getCount();k++) {
				var rhpIntrOp = rhpIntrOps.getItem(k);
				if (rhpIntrOp.getName().equals(rhpOp.getName())) {
					return ceIsClientServerInterface(rhpIntr)
				}
			}
		}
	}
	return false;
}

/*** Finds the operation in a block (implementation) the matching «operaetionWevent»
* that uses the event
* @param {IRP.Event} rhpEvent
* @param {boolean} forRequired true is required, otherwise provided
*/
function findOpWEvntImplForEvent(rhpEvent,forRequired) {
	var rhpOpWEvt = findOpWEvntForEvent(rhpEvent,forRequired);
	//logger.info("findOpWEvntImplForEvent - rhpOpWEvt" + rhpOpWEvt.port +" "+ rhpOpWEvt.operation);
	if (isNull(rhpOpWEvt)) {
		logger.severe("findOpWEvntImplForEvent - No mathching «operaetionWevent» found for the event: " + rhpEvent.getName());
		return null;
	}
	var rhpPort = rhpOpWEvt.port;
	var rhpIntrOp = rhpOpWEvt.operation;
	var rhpBlk = rhpPort.getOwner();
	var rhpOps = rhpBlk.getOperations();
	for(var k=1;k<=rhpOps.getCount();k++) {
		var rhpOp = rhpOps.getItem(k);
		if (rhpOp.getName().endsWith(rhpIntrOp.getName())) {
			return rhpOp;
		}
	}
	return null;
}

/**
* Check if an Operation (inside a Block) implements an operation in an interface
* that is provided in any of the Block's ports. Operations are matched by name;
* The block operation's name must end with the interface operation's name.
* 
* @param {IRP.Operation} rhpOpImpl
* @returns {boolean} Returns true, if the rhpOpImpl's is an implementation
* of an interface provided in one of the rhpOpImpl's owning Block ports.
*/
function isProvidedOpIml(rhpOpImpl) {
	var rhpClass = rhpOpImpl.getOwner();
	var rhpPorts = rhpClass.getPorts();
	for(var i=1;i<=rhpPorts.getCount();i++) {
		var rhpPort = rhpPorts.getItem(i);
		var rphIntrs = rhpPort.getProvidedInterfaces();
		for(var j=1;j<=rphIntrs.getCount();j++) {
			var rhpIntr = rphIntrs.getItem(j);
			var rhpIntrOps = rhpIntr.getOperations();
			for(var k=1;k<=rhpIntrOps.getCount();k++) {
				var rhpIntrOp = rhpIntrOps.getItem(k);
				if (rhpOpImpl.getName().endsWith(rhpIntrOp.getName())) {
					return true;
				}
			}
		}
	}
	return false;
}

/**
 * The AUTOSAR model uses a package hierarchy for components and interfaces:
 * 	Top Package
 *  ∟ SoftwareTypes
 *    ⊢ ComponentTypes
 *    ∟ Interfaces
 * 
 * This function can be used to created either the Components or Interfaces
 * package and the SoftwareTypes package if needed.
 * 
 * @param {MDW.ApplicationSwComponentType | MDW.PortInterface } element
 * @param {string} name the name of the element's parent package 
 * @returns 
 */
function addSWCPackageHierarchy(element, name) {
	return addARPackageHierarchy(element,"SoftwareTypes", name);
}


function addARPackageHierarchy(element, arPackageName, subPackageName) {
	var rhpEl = mapMDW2RhpElements.get(element);
	var rhpPkg = rhpEl.getOwner();
	var mdwPkg = mapRhp2MDWElements.get(rhpPkg);
	var mdwPkgs = mdwPkg.getArPackage();
	logger.info("------------ rhpEl "+ rhpEl.getName()+ " rhpPkg " + rhpPkg.getName()+" mdwPkg " + mdwPkg.getShortName().getValue()+ " mdwPkgs " +mdwPkgs );
	var mdwSwTypes;
	for (var k=0 ; k<mdwPkgs.size(); k++) {
		var mdwArPkg = mdwPkgs.get(k);
		if (mdwArPkg.getShortName().getValue() == arPackageName) {
			mdwSwTypes = mdwArPkg;
			var mdwSwTypesPkgs = mdwSwTypes.getArPackage();
			for(var i =0; i<mdwSwTypesPkgs.size(); i++) {
				var mdwItem = mdwSwTypesPkgs.get(i);
				if (mdwItem.getShortName().getValue() == subPackageName) {
					return mdwItem;
				}
			}
		}
	}
	if (isNull(mdwSwTypes)) {
		mdwSwTypes = createElementWithName("ARPackage", arPackageName);
		mdwPkg.getArPackage().add(mdwSwTypes);
	}
	var mdwCompTypes = createElementWithName("ARPackage", subPackageName);
	mdwSwTypes.getArPackage().add(mdwCompTypes);
	return mdwCompTypes;

}

/**
* If there is already a DataTypes AR-package, then
* find implementationDataType.
* If ImplementationDataType is NOT found, then
* create it and add to DataTypes. Otherwise, new element will be added to ImplemenetationDataType.
* If there is NO AR-packge for DataTypes, then create one with implementationDataType.
* 
* @param {IRP.Package} rhpPkg
* @returns {IRP.Package[]}
*/
function createDataTypesStructure(rhpPkg){
	var mdwArPkg = mapRhp2MDWElements.get(rhpPkg);
	var mdwDataTypesPkg = findElementByArPackage(mdwArPkg,"DataTypes");
	var mdwImplDataTypes;
	var mdwBaseTypes;
	if (isNotNull(mdwDataTypesPkg)) {
		mdwImplDataTypes = findElementByArPackage(mdwDataTypesPkg,"ImplementationDataTypes");
		if (isNull(mdwImplDataTypes)) {
			mdwImplDataTypes = createElementWithName("ARPackage","ImplementationDataTypes");
			mdwDataTypesPkg.getArPackage().add(mdwImplDataTypes);
		}
		mdwBaseTypes = findElementByArPackage(mdwDataTypesPkg,"BaseTypes");
		if (isNull(mdwBaseTypes)) {
			mdwBaseTypes = createElementWithName("ARPackage", "BaseTypes")
			mdwDataTypesPkg.getArPackage().add(mdwBaseTypes);
		}
	} else {
		mdwDataTypesPkg = createElementWithName("ARPackage","DataTypes");
		mdwArPkg.getArPackage().add(mdwDataTypesPkg);
		mdwImplDataTypes = createElementWithName("ARPackage","ImplementationDataTypes");
		mdwDataTypesPkg.getArPackage().add(mdwImplDataTypes);
		mdwBaseTypes = createElementWithName("ARPackage", "BaseTypes")
		mdwDataTypesPkg.getArPackage().add(mdwBaseTypes);
	}
	var result = new Array(3);
	result[0] = mdwDataTypesPkg;
	result[1] = mdwImplDataTypes;
	result[2] = mdwBaseTypes;
	return result;
}

function findElementByArPackage(element,elName){
	for (var i = 0 ; i < element.getArPackage().size(); i ++){
		var mdwElement = element.getArPackage().get(i);
			if (mdwElement.getShortName().getValue() == elName){
				return mdwElement;
		}
	}
	return null;
}

function createElementWithName(elType, elName){
	var newElement = model.create(elType);
	var identifier = model.create("Identifier");
	identifier.setValue(elName);
	newElement.setShortName(identifier);
	return newElement;
}

function createCIdentifier(value){
	var cId = model.create("CIdentifier");
	cId.setValue(value);
	return cId;
}

function connectDataProps(implementationDataType, implDataTypeName,mdwBaseTypes){
	// TODO: find the name of the SwBaseType

	/* var mdwSwBaseType = createElementWithName("SwBaseType", "sbt_"+implDataTypeName);
	mdwBaseTypes.getElement().add(mdwSwBaseType);
	var mdwSwDataDefProps = model.create("SwDataDefProps");
	implementationDataType.setSwDataDefProps(mdwSwDataDefProps);
	var swDefPropVariant = model.create("SwDataDefPropsConditional");
	mdwSwDataDefProps.getSwDataDefPropsVariant().add(swDefPropVariant);
	//swDefPropVariant.setBaseType(mdwSwBaseType);
	// TODO add BaseTypeDirectionDefinition
	//var mdwBaseTypeDirDef = model.create("BaseTypeDirectionDefinition");
	//mdwSwBaseType.setBaseTypeDefinition(mdwBaseTypeDirDef);*/
}

function createRunnableEntity(name){
	var mdwRunEnt = createElementWithName("RunnableEntity", name);
	completeRunnableEntity(mdwRunEnt);
	return mdwRunEnt;
}

function completeRunnableEntity(element){
	element.setSymbol(createCIdentifier(element.getShortName().getValue()));
	element.setCanBeInvokedConcurrently(false);
	element.setMinimumStartInterval(100);
}


/**
 * Craete an AutosarVariableReference for the VariableDataPrototype if it doesn't
 * exist.
 *
 * @param {MDW.VariableAcess} varAccess
 * @param {MDW.VariableDataPrototype} varDataPrtyp
 **/
function createVariableRef(varAccess, varDataPrtyp) {
	var accessedVariable = varAccess.getAccessedVariable();
   if (isNull(accessedVariable)) {
	   accessedVariable = model.create("AutosarVariableRef");
	   accessedVariable.setLocalVariable(varDataPrtyp);
	   varAccess.setAccessedVariable(accessedVariable);
   } else {
	   accessedVariable.setLocalVariable(varDataPrtyp);
   }
}

/**
* Craete a VariableAccess for the SysML attribute if it doesn't exist.
*
* Existing VariableAccess are matched by name.
*
* @param {IRP.Attribute} attribute
* @param {MDW.RunnableEntity} runnable
* @param {string} tagType
* @returns {MDW.VariableAcess} varAccessForAttr
**/
function createVariableAccess(attribute, runnable, tagType) {
   var varAccessForAttr = null;
   var varAccesses;
   //check if the tag type is true, which means that the "data received point" should be by value
   if (tagType == 'true') {
	   varAccesses = runnable.getDataReceivePointByValue();
   } else {
	   varAccesses = runnable.getDataReceivePointByArgument();
   }
   for(var i=1; i<=varAccesses.size(); i++) {
	   var varAccess = varAccesses.getItem(i);
	   if (varAccess.getName() == attribute.getShortName().getValue()) {
		   varAccessForAttr = varAccess;
		   break;
	   }
   }
   if (varAccessForAttr == null) {
	   varAccessForAttr = model.create("VariableAccess");
	   var identifier = model.create("Identifier");
	   identifier.setValue(attribute.getName());
	   varAccessForAttr.setShortName(identifier);
	   if (tagType == 'true') {
		   runnable.getDataReceivePointByValue().add(varAccessForAttr);
	   } else {
		   runnable.getDataReceivePointByArgument().add(varAccessForAttr);
	   }
   }
   return varAccessForAttr;
}

/**
*  Creates POperationInAtomicSwcInstanceRef
* @param {MDW.ApplicationSwComponentType} mdwAppSwComp
* @param {IRP.Event} rhpEvent
* @param {MDW.OperationInvokedEvent} opInvkEvnt
* @returns {boolean} true, if it can create the elements for POperationInAtomicSwcInstanceRef, otherside false.
*/
function createPOpRef(mdwAppSwComp, rhpEvent, opInvkEvnt) {
	// get the source Block in SysML
	var rhpBlk = mapMDW2RhpElements.get(mdwAppSwComp);
   var objOperationAndPort = findOpWEvntForEvent(rhpEvent);
   if (isNull(objOperationAndPort)) {
	   return false;
   }
   var mdwCSOperation = mapRhp2MDWElements.get(objOperationAndPort.operation);
   var mdwPOpRef = model.create("POperationInAtomicSwcInstanceRef");
   mdwPOpRef.setTargetProvidedOperation(mdwCSOperation);

   var mdwPPortPrototype = mapRhp2MDWElements.get(objOperationAndPort.port);
   mdwPOpRef.setContextPPort(mdwPPortPrototype);
   opInvkEvnt.setOperation(mdwPOpRef); 

   return true;
}

function createInternalBehavior(name){
	var mdwIntBehav = createElementWithName(
		"SwcInternalBehavior",
		"IB_" + name);
	mdwIntBehav.setSupportsMultipleInstantiation(false);
	//var handle = Java.type('com.ibm.rational.rhapsody.metamodel.autosar00045.HandleTerminationAndRestartEnum');
	//mdwIntBehav.setHandleTerminationAndRestart(handle.noSupport);
	return mdwIntBehav;
}

/**
 * Create an AUTOSAR CompuMethod for the Rhapsody enumeration.
 *
 * Using the example provided by AUTOSAR:
 * <code>
 *    <COMPU-METHOD>
 *      <SHORT-NAME>boolean</SHORT-NAME>
 *      <CATEGORY>TEXTTABLE</CATEGORY>
 *      <COMPU-INTERNAL-TO-PHYS>
 *        <COMPU-SCALES>
 *          <COMPU-SCALE>
 *            <LOWER-LIMIT INTERVAL-TYPE="CLOSED">0</LOWER-LIMIT>
 *            <UPPER-LIMIT INTERVAL-TYPE="CLOSED">0</UPPER-LIMIT>
 *            <COMPU-CONST>
 *              <VT>false</VT>
 *            </COMPU-CONST>
 *          </COMPU-SCALE>
 *          <COMPU-SCALE>
 *            <LOWER-LIMIT INTERVAL-TYPE="CLOSED">1</LOWER-LIMIT>
 *            <UPPER-LIMIT INTERVAL-TYPE="CLOSED">1</UPPER-LIMIT>
 *            <COMPU-CONST>
 *              <VT>true</VT>
 *            </COMPU-CONST>
 *          </COMPU-SCALE>
 *        </COMPU-SCALES>
 *      </COMPU-INTERNAL-TO-PHYS>
 *    </COMPU-METHOD>
 * </code>
 * each enumeration item has to become a compuscale.
 *
 * @param {IRP.Type} rhpEnum
 */
function createCompuMethod(rhpEnum) {
	var mdwCmpMthd = createElementWithName('CompuMethod', rhpEnum.getName());
	var mdwAppDataType = mapRhp2MDWElements.get(rhpEnum);
	var mdwCompuMethodsPkg = addARPackageHierarchy(mdwAppDataType,'DataTypes', 'CompuMethods');
	logger.info("createCompuMethod - 1" );
	mdwCompuMethodsPkg.getElement().add(mdwCmpMthd);
	mdwCmpMthd.setCategory('TEXTTABLE'); 
	var mdwI2P = model.create('Compu');
	
	mdwCmpMthd.setCompuInternalToPhys(mdwI2P);
	logger.info("createCompuMethod - 2");
	mdwI2P.setCompuContent(enumScales(rhpEnum));
	logger.info("createCompuMethod - 3");
	return mdwCmpMthd;
}

/**
 *        <COMPU-SCALES>
 *          <COMPU-SCALE>
 *            <LOWER-LIMIT INTERVAL-TYPE="CLOSED">0</LOWER-LIMIT>
 *            <UPPER-LIMIT INTERVAL-TYPE="CLOSED">0</UPPER-LIMIT>
 *            <COMPU-CONST>
 *              <VT>false</VT>
 *            </COMPU-CONST>
 *          </COMPU-SCALE>
 *          <COMPU-SCALE>
 *            <LOWER-LIMIT INTERVAL-TYPE="CLOSED">1</LOWER-LIMIT>
 *            <UPPER-LIMIT INTERVAL-TYPE="CLOSED">1</UPPER-LIMIT>
 *            <COMPU-CONST>
 *              <VT>true</VT>
 *            </COMPU-CONST>
 *          </COMPU-SCALE>
 *        </COMPU-SCALES>
 * @param {IRP.Type} rhpEnum
 */
function enumScales(rhpEnum) {
   var mdwScales = model.create('CompuScales');
   logger.info("enumScales - 1");
   var enumLiterals = rhpEnum.getEnumerationLiterals();
   logger.info("enumScales - 2");
   for (var i=1; i<=enumLiterals.getCount(); i++) {
      var literal = enumLiterals.getItem(i);
	  logger.info("enumLiteralScale(literal) " + enumLiteralScale(literal));
      mdwScales.getCompuScale().add(enumLiteralScale(literal));
	  logger.info("enumScales - 3");
   }
   return mdwScales;
}

/**
 *          <COMPU-SCALE>
 *            <LOWER-LIMIT INTERVAL-TYPE="CLOSED">0</LOWER-LIMIT>
 *            <UPPER-LIMIT INTERVAL-TYPE="CLOSED">0</UPPER-LIMIT>
 *            <COMPU-CONST>
 *              <VT>false</VT>
 *            </COMPU-CONST>
 *          </COMPU-SCALE>
 * @param {IRP.EnumerationLiteral} rhpLiteral
 */
function enumLiteralScale(rhpLiteral) {
   var mdwScale = model.create('CompuScale');
   var mdwLimitVariaPoint = model.create('LimitValueVariationPoint');
   //intervalType is "CLOSED" by default
   //logger.info("enumLiteralScale - 1");
   var mdwATP = model.create("AtpMixedStringDataType");
   mdwATP.setValue(rhpLiteral.getValue());
   mdwLimitVariaPoint.getAtpMixedStringData().add(mdwATP);
   //logger.info("enumLiteralScale - 2");
   mdwScale.setLowerLimit(mdwLimitVariaPoint);
   //logger.info("enumLiteralScale - 3");
   mdwScale.setUpperLimit(mdwLimitVariaPoint);
   //logger.info("enumLiteralScale - 4");
   var mdwConst = model.create('CompuConstTextContent');
   //logger.info("enumLiteralScale - 5");
   var mdwVerbatimString = model.create("VerbatimString");
   mdwVerbatimString.setValue(rhpLiteral.getName());
   //logger.info("enumLiteralScale - 6");
   mdwConst.setVt(mdwVerbatimString);
   //logger.info("enumLiteralScale - 7");
   var mdwCompuScaleConstCont = model.create("CompuScaleConstantContents");
   var mdwCompuConst = model.create("CompuConst");
   //logger.info("enumLiteralScale - 7.1");
   mdwCompuConst.setCompuConstContentType(mdwConst);
   //logger.info("enumLiteralScale - 7.2");
   mdwCompuScaleConstCont.setCompuConst(mdwCompuConst);
   //logger.info("enumLiteralScale - 8");
   mdwScale.setCompuScaleContents(mdwCompuScaleConstCont);
  // logger.info("enumLiteralScale - 9");
   return mdwScale;
}

/** === End Common  === **/
