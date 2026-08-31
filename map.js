(() => {
  'use strict';
  let sdkPromise = null;
  let configPromise = null;

  function reportDiagnostic(event, detail = '') {
    try {
      fetch('/api/client-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, detail })
      }).catch(() => {});
    } catch {}
  }

  function installDiagnostics() {
    const locationButton = document.querySelector('#locationButton');
    if (locationButton) {
      locationButton.addEventListener('click', () => {
        const originalText = locationButton.textContent;
        locationButton.textContent = '위치 확인 중…';
        locationButton.setAttribute('aria-busy', 'true');
        reportDiagnostic('location_click', `geolocation=${Boolean(navigator.geolocation)};secureContext=${Boolean(window.isSecureContext)}`);
        window.setTimeout(() => {
          const loadingHidden = document.querySelector('#loadingCard')?.classList.contains('hidden');
          const permissionHidden = document.querySelector('#permissionCard')?.classList.contains('hidden');
          reportDiagnostic('location_ui_after_click', `loadingHidden=${loadingHidden};permissionHidden=${permissionHidden}`);
          if (loadingHidden && permissionHidden === false) {
            locationButton.textContent = originalText;
            locationButton.removeAttribute('aria-busy');
            const note = document.querySelector('.privacy-note');
            if (note) note.textContent = '버튼 동작을 시작하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.';
          }
        }, 500);
      }, { capture: true });
    }

    window.addEventListener('error', (event) => reportDiagnostic('window_error', String(event.message || 'unknown_error').slice(0, 220)));
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || 'unknown_rejection');
      reportDiagnostic('unhandled_rejection', reason.slice(0, 220));
    });
    reportDiagnostic('diagnostics_ready', `geolocation=${Boolean(navigator.geolocation)};secureContext=${Boolean(window.isSecureContext)}`);
  }

  async function getConfig() {
    if (!configPromise) {
      configPromise = fetch('/api/config')
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('config_http')))
        .catch(() => ({ kakaoJavaScriptKey: '', kmaConfigured: false }));
    }
    return configPromise;
  }

  async function loadSdk() {
    if (window.kakao?.maps?.services) return true;
    if (sdkPromise) return sdkPromise;

    sdkPromise = (async () => {
      const config = await getConfig();
      if (!config.kakaoJavaScriptKey) return false;
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(config.kakaoJavaScriptKey)}&autoload=false&libraries=services`;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('kakao_sdk_load_failed'));
        document.head.appendChild(script);
      });
      await new Promise((resolve) => window.kakao.maps.load(resolve));
      return Boolean(window.kakao?.maps?.services);
    })().catch((error) => {
      console.warn(error);
      reportDiagnostic('kakao_sdk_error', String(error?.message || error).slice(0, 220));
      return false;
    });

    return sdkPromise;
  }

  async function resolveRegion(position) {
    if (!await loadSdk()) return null;
    return new Promise((resolve) => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2RegionCode(position.longitude, position.latitude, (result, status) => {
        if (status !== window.kakao.maps.services.Status.OK || !result?.length) {
          resolve(null);
          return;
        }
        const region = result.find((entry) => entry.region_type === 'H') || result[0];
        resolve({
          label: region.address_name,
          district: region.region_2depth_name,
          neighborhood: region.region_3depth_name,
          code: region.code
        });
      });
    });
  }

  async function searchLocation(query) {
    if (!await loadSdk()) return null;
    const maps = window.kakao.maps;
    const normalized = String(query || '').trim();
    if (!normalized) return null;

    const addressResult = await new Promise((resolve) => {
      const geocoder = new maps.services.Geocoder();
      geocoder.addressSearch(normalized, (result, status) => {
        if (status !== maps.services.Status.OK || !result?.length) {
          resolve(null);
          return;
        }
        const item = result[0];
        resolve({
          latitude: Number(item.y),
          longitude: Number(item.x),
          label: item.address_name || normalized,
          kind: 'address'
        });
      });
    });
    if (addressResult) return addressResult;

    return new Promise((resolve) => {
      const places = new maps.services.Places();
      places.keywordSearch(normalized, (result, status) => {
        if (status !== maps.services.Status.OK || !result?.length) {
          resolve(null);
          return;
        }
        const item = result[0];
        resolve({
          latitude: Number(item.y),
          longitude: Number(item.x),
          label: item.address_name || item.road_address_name || item.place_name || normalized,
          placeName: item.place_name || '',
          kind: 'keyword'
        });
      });
    });
  }

  function ensureSearchStyles() {
    if (document.querySelector('#bangsMapSearchStyles')) return;
    const style = document.createElement('style');
    style.id = 'bangsMapSearchStyles';
    style.textContent = `
      .map-search-panel{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:0 0 10px}
      .map-search-input{min-width:0;border:1px solid #ead7df;border-radius:14px;padding:12px 14px;font:inherit;background:#fff;color:#20171c;outline:none}
      .map-search-input:focus{border-color:#e9518d;box-shadow:0 0 0 3px rgba(233,81,141,.12)}
      .map-search-button{border:0;border-radius:14px;padding:0 16px;background:#30262c;color:#fff;font:inherit;font-weight:700;cursor:pointer}
      .map-search-result{grid-column:1/-1;margin:0 2px;font-size:13px;line-height:1.45;color:#7d6871}
      @media (max-width:520px){.map-search-panel{grid-template-columns:1fr}.map-search-button{padding:11px 14px}.map-search-result{grid-column:1}}
    `;
    document.head.appendChild(style);
  }

  function installSearchPanel(container, onSearch) {
    const parent = container?.parentElement;
    if (!parent) return null;
    ensureSearchStyles();

    let panel = parent.querySelector('.map-search-panel');
    if (panel) return panel;

    panel = document.createElement('form');
    panel.className = 'map-search-panel';
    panel.setAttribute('role', 'search');

    const input = document.createElement('input');
    input.className = 'map-search-input';
    input.type = 'search';
    input.autocomplete = 'off';
    input.placeholder = '동네·주소 검색 (예: 용인시 수지구 동천동)';
    input.setAttribute('aria-label', '동네 또는 주소 검색');

    const button = document.createElement('button');
    button.className = 'map-search-button';
    button.type = 'submit';
    button.textContent = '검색';

    const result = document.createElement('p');
    result.className = 'map-search-result';
    result.textContent = 'PC 위치가 많이 어긋나면 동네나 주소를 검색해 바로 이동할 수 있어요.';

    panel.append(input, button, result);
    parent.insertBefore(panel, container);

    panel.addEventListener('submit', async (event) => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) {
        result.textContent = '동네나 주소를 입력해 주세요.';
        input.focus();
        return;
      }

      button.disabled = true;
      button.textContent = '검색 중…';
      result.textContent = `'${query}' 위치를 찾는 중입니다.`;
      try {
        const found = await onSearch(query);
        if (!found) {
          result.textContent = '검색 결과를 찾지 못했어요. 시·구·동을 함께 입력하거나 도로명 주소를 입력해 보세요.';
          reportDiagnostic('map_search_not_found', `queryLength=${query.length}`);
          return;
        }
        const display = found.placeName && !found.label.includes(found.placeName)
          ? `${found.placeName} · ${found.label}`
          : found.label;
        result.textContent = `${display} 근처로 이동했어요. 지도를 확인한 뒤 아래 '이 위치로 다시 계산'을 눌러 주세요.`;
        reportDiagnostic('map_search_success', `kind=${found.kind}`);
      } catch (error) {
        result.textContent = '검색 중 오류가 났어요. 잠시 뒤 다시 시도해 주세요.';
        reportDiagnostic('map_search_error', String(error?.message || error).slice(0, 120));
      } finally {
        button.disabled = false;
        button.textContent = '검색';
      }
    });

    return panel;
  }

  async function createPicker(container, initialPosition, onChange) {
    if (!await loadSdk()) return null;
    const maps = window.kakao.maps;
    const center = new maps.LatLng(initialPosition.latitude, initialPosition.longitude);
    const map = new maps.Map(container, { center, level: 4 });
    const marker = new maps.Marker({ map, position: center, draggable: true });

    const emit = async (latLng) => {
      const position = { latitude: latLng.getLat(), longitude: latLng.getLng() };
      marker.setPosition(latLng);
      const region = await resolveRegion(position);
      onChange({ ...position, region });
      return region;
    };

    maps.event.addListener(marker, 'dragend', () => emit(marker.getPosition()));
    maps.event.addListener(map, 'click', (mouseEvent) => emit(mouseEvent.latLng));

    installSearchPanel(container, async (query) => {
      const found = await searchLocation(query);
      if (!found || !Number.isFinite(found.latitude) || !Number.isFinite(found.longitude)) return null;
      const latLng = new maps.LatLng(found.latitude, found.longitude);
      map.setLevel(4);
      map.setCenter(latLng);
      await emit(latLng);
      return found;
    });

    return {
      setPosition(position) {
        const latLng = new maps.LatLng(position.latitude, position.longitude);
        marker.setPosition(latLng);
        map.setCenter(latLng);
        map.relayout();
      },
      relayout() {
        map.relayout();
      }
    };
  }

  window.BangsMap = { getConfig, loadSdk, resolveRegion, searchLocation, createPicker };
  installDiagnostics();
})();
