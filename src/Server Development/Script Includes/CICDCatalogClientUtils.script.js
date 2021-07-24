var CICDCatalogClientUtils = Class.create();
CICDCatalogClientUtils.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {

	getAccessibleUpdateSets : function(){
		if(gs.hasRole('admin')){
			return '';
		}
		else{
			var apps=[];
			var grApps= new GlideRecordSecure('sys_scope');
			grApps.addActiveQuery();
			grApps.query();
			while(grApps.next()){			
				apps.push(grApps.getUniqueValue());
			}
			return 'applicationIN'+apps.join(',');
		}
	},
    type: 'CICDCatalogClientUtils'
});