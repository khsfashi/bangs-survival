(() => {
  'use strict';
  let sdkPromise=null,configPromise=null;

  function reportDiagnostic(event,detail=''){
    try{
      fetch('/api/client-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,detail})}).catch(()=>{});
    }catch{}
  }

  function installDiagnostics(){
    const locationButton=document.querySelector('#locationButton');
    if(locationButton){
      locationButton.addEventListener('click',()=>{
        const originalText=locationButton.textContent;
        locationButton.textContent='위치 확인 중…';
        locationButton.setAttribute('aria-busy','true');
        reportDiagnostic('location_click',`geolocation=${Boolean(navigator.geolocation)};secureContext=${Boolean(window.isSecureContext)}`);
        window.setTimeout(()=>{
          const loadingHidden=document.querySelector('#loadingCard')?.classList.contains('hidden');
          const permissionHidden=document.querySelector('#permissionCard')?.classList.contains('hidden');
          reportDiagnostic('location_ui_after_click',`loadingHidden=${loadingHidden};permissionHidden=${permissionHidden}`);
          if(loadingHidden&&permissionHidden===false){
            locationButton.textContent=originalText;
            locationButton.removeAttribute('aria-busy');
            const note=document.querySelector('.privacy-note');
            if(note)note.textContent='버튼 동작을 시작하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.';
          }
        },500);
      },{capture:true});
    }
    window.addEventListener('error',(event)=>reportDiagnostic('window_error',String(event.message||'unknown_error').slice(0,220)));
    window.addEventListener('unhandledrejection',(event)=>{
      const reason=event.reason instanceof Error?event.reason.message:String(event.reason||'unknown_rejection');
      reportDiagnostic('unhandled_rejection',reason.slice(0,220));
    });
    reportDiagnostic('diagnostics_ready',`geolocation=${Boolean(navigator.geolocation)};secureContext=${Boolean(window.isSecureContext)}`);
  }

  async function getConfig(){if(!configPromise){configPromise=fetch('/api/config').then((response)=>response.ok?response.json():Promise.reject(new Error('config_http'))).catch(()=>({kakaoJavaScriptKey:'',kmaConfigured:false}));}return configPromise;}
  async function loadSdk(){if(window.kakao?.maps?.services)return true;if(sdkPromise)return sdkPromise;sdkPromise=(async()=>{const config=await getConfig();if(!config.kakaoJavaScriptKey)return false;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(config.kakaoJavaScriptKey)}&autoload=false&libraries=services`;script.async=true;script.onload=resolve;script.onerror=()=>reject(new Error('kakao_sdk_load_failed'));document.head.appendChild(script);});await new Promise((resolve)=>window.kakao.maps.load(resolve));return Boolean(window.kakao?.maps?.services);})().catch((error)=>{console.warn(error);reportDiagnostic('kakao_sdk_error',String(error?.message||error).slice(0,220));return false;});return sdkPromise;}
  async function resolveRegion(position){if(!await loadSdk())return null;return new Promise((resolve)=>{const geocoder=new window.kakao.maps.services.Geocoder();geocoder.coord2RegionCode(position.longitude,position.latitude,(result,status)=>{if(status!==window.kakao.maps.services.Status.OK||!result?.length){resolve(null);return;}const region=result.find((entry)=>entry.region_type==='H')||result[0];resolve({label:region.address_name,district:region.region_2depth_name,neighborhood:region.region_3depth_name,code:region.code});});});}
  async function createPicker(container,initialPosition,onChange){if(!await loadSdk())return null;const maps=window.kakao.maps;const center=new maps.LatLng(initialPosition.latitude,initialPosition.longitude);const map=new maps.Map(container,{center,level:4});const marker=new maps.Marker({map,position:center,draggable:true});const emit=async(latLng)=>{const position={latitude:latLng.getLat(),longitude:latLng.getLng()};marker.setPosition(latLng);const region=await resolveRegion(position);onChange({...position,region});};maps.event.addListener(marker,'dragend',()=>emit(marker.getPosition()));maps.event.addListener(map,'click',(mouseEvent)=>emit(mouseEvent.latLng));return{setPosition(position){const latLng=new maps.LatLng(position.latitude,position.longitude);marker.setPosition(latLng);map.setCenter(latLng);map.relayout();},relayout(){map.relayout();}};}
  window.BangsMap={getConfig,loadSdk,resolveRegion,createPicker};
  installDiagnostics();
})();
