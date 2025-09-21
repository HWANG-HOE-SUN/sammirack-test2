import React, { 
  createContext, useContext, useState, useEffect, useCallback, useMemo 
} from "react";
import { sortBOMaterialRule } from "../utils/materialSort";

const ProductContext = createContext();

const formTypeRacks = ["스텐랙", "스텐랙", "하이랙", "파렛트랙 철판형"];

// 하이랙 그룹 높이
const HIGH_RACK_HEIGHTS = ["150", "200", "250"];

const EXTRA_OPTIONS = {
  파렛트랙: { height: ["H4500", "H5000", "H5500", "H6000"] },
  "파렛트랙 철판형": {
    height: ["1500", "2000", "2500", "3000", "3500", "4000", "H4500", "H5000", "H5500", "H6000"],
    size: ["2580x800", "2580x1000"]
  },
  하이랙: { size: ["45x150"], level: ["5단", "6단"] },
  스텐랙: { level: ["5단", "6단"], height: ["210"] },
  상하랙: { height: ["H750"] }
};

const COMMON_LEVELS = ["2단", "3단", "4단", "5단", "6단"];
export const colorLabelMap = { "200kg": "270kg", "350kg": "450kg", "700kg": "550kg" };

const parseSize = (s="")=>{
  const m=String(s).replace(/\s*/g, "").match(/(\d+)/);
  return m?{a:Number(m[1]),b:Number(m[2])}:null;
};

const sortSizes=(arr=[])=>[...new Set(arr)].sort((A,B)=>{
  const a=parseSize(A),b=parseSize(B);
  if(a&&b){ if(a.a!=b.a)return a.a-b.a; if(a.b!=b.b)return a.b-b.b; }
  return String(A).localeCompare(String(B),"ko");
});

const parseNum=(s="")=>{
  const m=String(s).match(/\d+/);
  return m?Number(m[0]):Number.POSITIVE_INFINITY;
};

const sortHeights=(arr=[])=>[...new Set(arr)].sort((a,b)=>parseNum(a)-parseNum(b));
const sortLevels=(arr=[])=>[...new Set(arr)].sort((a,b)=>parseNum(a)-parseNum(b));

const HIGHRACK_550_ALIAS_VIEW_FROM_DATA = { "80x146":"80x100", "80x200":"80x150" };
const HIGHRACK_550_ALIAS_DATA_FROM_VIEW = { "80x108":"80x146", "80x150":"80x200" };

const parseHeight = (h)=>Number(String(h).replace(/[^\d]/g,""))||0;
const parseLevels = (levelStr, rackType)=>{
  if(!levelStr) return 4;
  if(rackType==="파렛트랙 철판형"){
    const m=String(levelStr).match(/L?(\d+)/); return m?parseInt(m[1]):4;
  } else {
    const m=String(levelStr).match(/(\d+)/); return m?parseInt(m[1]):4;
  }
};

const parseWD=(size="")=>{
  const m=String(size).replace(/\s*/g, "").match(/(\d+)\*?(\d+)/);
  return m?{w:Number(m[1]),d:Number(m[2])}:{w:null,d:null};
};

const calcPalletIronShelfPerLevel=(size)=>{
  const {w,d}=parseWD(size);
  if(w===1300) return 2;
  if(w===2000) return 3;
  if(w===2580) return 4;
  return 1;
};

const calcHighRackShelfPerLevel=(size)=>{
  const {d}=parseWD(size);
  if(d===1300) return 2;
  if(d===2000) return 3;
  if(d===2580) return 4;
  return 1;
};

export function ProductProvider({ children }) {
  // 기존 상태들
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  
  // 새로 추가된 단가 관리 상태
  const [adminPrices, setAdminPrices] = useState({});
  const [allMaterials, setAllMaterials] = useState(new Map());
  const [refreshKey, setRefreshKey] = useState(0);
  
  // 새로 추가된 재고 관리 상태
  const [inventory, setInventory] = useState({});
  
  // localStorage에서 관리자 가격 로드
  const loadAdminPrices = useCallback(async () => {
    try {
      const stored = localStorage.getItem(\'admin_edit_prices\') || \'{}\';
      const priceData = JSON.parse(stored);
      setAdminPrices(priceData);
    } catch (error) {
      console.error(\'관리자 단가 로드 실패:\', error);
      setAdminPrices({});
    }
  }, []);

  // localStorage에서 재고 정보 로드
  const loadInventory = useCallback(async () => {
    try {
      const stored = localStorage.getItem(\'inventory_data\') || \'{}\';
      const inventoryData = JSON.parse(stored);
      setInventory(inventoryData);
    } catch (error) {
      console.error(\'재고 정보 로드 실패:\', error);
      setInventory({});
    }
  }, []);

  // 전체 자재 데이터 로드
  const loadAllMaterials = useCallback(async () => {
    try {
      // 1. bomData에서 모든 자재 추출 (기존 로직)
      const bomResponse = await fetch(\'./bom_data.json\');
      const bomData = await bomResponse.json();
      
      // 2. data.json에서 가격 정보 추출 (기존 로직)
      const dataResponse = await fetch(\'./data.json\');
      const priceData = await dataResponse.json();
      
      const materials = new Map();
      
      // BOM 데이터에서 모든 부품들을 추출하는 로직 (기존과 동일)
      Object.keys(bomData).forEach(rackType => {
        const rackData = bomData[rackType];
        Object.keys(rackData).forEach(size => {
          Object.keys(rackData[size]).forEach(height => {
            Object.keys(rackData[size][height]).forEach(level => {
              Object.keys(rackData[size][height][level]).forEach(formType => {
                const components = rackData[size][height][level][formType]?.components || [];
                components.forEach(component => {
                  const partId = generatePartId({
                    rackType,
                    name: component.name,
                    specification: component.specification || \'\',
                    unitPrice: Number(component.unit_price) || 0,
                    size,
                    height,
                    level,
                    formType
                  });
                  
                  if (!materials.has(partId)) {
                    materials.set(partId, {
                      partId,
                      rackType,
                      name: component.name,
                      specification: component.specification || \'\',
                      unitPrice: Number(component.unit_price) || 0,
                      size, height, level, formType
                    });
                  }
                });
              });
            });
          });
        });
      });
      
      // 하이랙 데이터 처리 (기존 로직)
      if (priceData[\'하이랙\']) {
        const hiRackData = priceData[\'하이랙\'];
        const colors = hiRackData[\'색상\'] || [];
        const heights = [\'150\', \'200\', \'250\'];
        const levels = [\'1단\', \'2단\', \'3단\', \'4단\', \'5단\', \'6단\'];
        const formTypes = [\'하중형\', \'일반형\'];
        
        colors.forEach(color => {
          const weightOnly = extractWeightOnly(color);
          const basePrice = hiRackData[\'기본가\'][color] || {};
          const sizes = Object.keys(basePrice);
          
          sizes.forEach(size => {
            heights.forEach(height => {
              levels.forEach(level => {
                formTypes.forEach(formType => {
                  const levelNum = parseInt(level) || 1;
                  const isForm = formType === \'hardForm\';
                  
                  // 기둥 처리
                  const pillarPartId = generatePartId({
                    rackType: \'하이랙\',
                    name: \'기둥\',
                    specification: `높이 ${height}${weightOnly ? ` ${weightOnly}` : \'\'}`,
                    unitPrice: 0,
                    size, height, level, formType
                  });
                  
                  if (!materials.has(pillarPartId)) {
                    materials.set(pillarPartId, {
                      partId: pillarPartId,
                      rackType: \'하이랙\',
                      name: \'기둥\',
                      specification: `높이 ${height}${weightOnly ? ` ${weightOnly}` : \'\'}`,
                      unitPrice: 0,
                      size, height, level, formType
                    });
                  }
                  
                  // 로드빔 처리
                  const sizeMatch = String(size).replace(/\s*/g, \'\').match(/(\d+)\*(\d+)/);
                  const rodBeamNum = sizeMatch ? sizeMatch[2] : \'\';
                  if (rodBeamNum) {
                    const beamPartId = generatePartId({
                      rackType: \'하이랙\',
                      name: \'로드빔\',
                      specification: `${rodBeamNum}${weightOnly ? ` ${weightOnly}` : \'\'}`,
                      unitPrice: 0,
                      size, height, level, formType
                    });
                    
                    if (!materials.has(beamPartId)) {
                      materials.set(beamPartId, {
                        partId: beamPartId,
                        rackType: \'하이랙\',
                        name: \'로드빔\',
                        specification: `${rodBeamNum}${weightOnly ? ` ${weightOnly}` : \'\'}`,
                        unitPrice: 0,
                        size, height, level, formType
                      });
                    }
                  }
                });
              });
            });
          });
        });
      }
      
      setAllMaterials(materials);
    } catch (error) {
      console.error(\'자재 데이터 로드 실패:\', error);
    }
  }, []);

  // 부품 ID 생성 함수 (기존 로직과 동일)
  const generatePartId = useCallback((item) => {
    const { rackType, name, specification } = item;
    const cleanName = name.replace(/[^\w가-힣]/g, \'\');
    const cleanSpec = (specification || \'\').replace(/[^\w가-힣]/g, \'\');
    return `${rackType}-${cleanName}-${cleanSpec}`.toLowerCase();
  }, []);

  // 유효 단가 계산 (관리자 가격 우선, 없으면 기본 가격)
  const getEffectiveUnitPrice = useCallback((item) => {
    const partId = generatePartId(item);
    const adminPrice = adminPrices[partId];
    
    if (adminPrice && adminPrice.price > 0) {
      return adminPrice.price;
    }
    
    return Number(item.unitPrice ?? 0);
  }, [adminPrices, generatePartId]);

  // 관리자 가격 업데이트
  const updateAdminPrice = useCallback((partId, price, reason = \'\') => {
    const newPrices = {
      ...adminPrices,
      [partId]: {
        price: Number(price),
        updatedAt: new Date().toISOString(),
        reason
      }
    };
    
    setAdminPrices(newPrices);
    localStorage.setItem(\'admin_edit_prices\', JSON.stringify(newPrices));
    
    // 상태 변경 알림
    setRefreshKey(prev => prev + 1);
    
    // 커스텀 이벤트 발생 (기존 이벤트 시스템과의 호환성)
    window.dispatchEvent(new CustomEvent(\'adminPriceChanged\', {
      detail: { partId, price, reason }
    }));
  }, [adminPrices]);

  // 재고 수량 업데이트
  const updateInventory = useCallback((partId, quantity) => {
    const newInventory = {
      ...inventory,
      [partId]: Number(quantity)
    };
    
    setInventory(newInventory);
    localStorage.setItem(\'inventory_data\', JSON.stringify(newInventory));
  }, [inventory]);

  // 재고 수량 조회
  const getInventoryQuantity = useCallback((partId) => {
    return inventory[partId] || 0;
  }, [inventory]);

  // 랙 종류별 부품 목록 조회
  const getPartsByRackType = useCallback((rackType) => {
    const parts = [];
    allMaterials.forEach((material, partId) => {
      if (material.rackType === rackType) {
        parts.push({
          ...material,
          effectivePrice: getEffectiveUnitPrice(material),
          inventoryQuantity: getInventoryQuantity(partId)
        });
      }
    });
    return parts.sort((a, b) => a.name.localeCompare(b.name, \'ko\'));
  }, [allMaterials, getEffectiveUnitPrice, getInventoryQuantity]);

  // 모든 랙 종류 목록 조회
  const getAllRackTypes = useCallback(() => {
    const rackTypes = new Set();
    allMaterials.forEach(material => {
      rackTypes.add(material.rackType);
    });
    return Array.from(rackTypes).sort();
  }, [allMaterials]);

  // 초기 데이터 로드
  useEffect(() => {
    loadAdminPrices();
    loadInventory();
    loadAllMaterials();
  }, [loadAdminPrices, loadInventory, loadAllMaterials]);

  // 기존 함수들 (변경 없음)
  const updateCurrentCartMaterials = useCallback(() => {
    if (cart && cart.length > 0) {
      // 기존 로직 유지
    }
  }, [cart]);

  // extractWeightOnly 함수 (기존 로직)
  const extractWeightOnly = (color) => {
    const weightMatch = String(color).replace(/\s*/g, \'\').match(/(\d+)kg/);
    return weightMatch ? `${weightMatch[1]}kg` : \'\';
  };

  // Context 값
  const contextValue = useMemo(() => ({
    // 기존 상태들
    currentUser,
    setCurrentUser,
    cart,
    setCart,
    updateCurrentCartMaterials,
    
    // 단가 관리
    adminPrices,
    allMaterials,
    refreshKey,
    loadAdminPrices,
    loadAllMaterials,
    generatePartId,
    getEffectiveUnitPrice,
    updateAdminPrice,
    
    // 재고 관리
    inventory,
    updateInventory,
    getInventoryQuantity,
    getPartsByRackType,
    getAllRackTypes,
    
    // 유틸리티 함수들 (기존)
    parseSize,
    sortSizes,
    sortHeights,
    sortLevels,
    parseHeight,
    parseLevels,
    parseWD,
    calcPalletIronShelfPerLevel,
    calcHighRackShelfPerLevel,
    extractWeightOnly,
    
    // 상수들 (기존)
    formTypeRacks,
    HIGH_RACK_HEIGHTS,
    EXTRA_OPTIONS,
    COMMON_LEVELS,
    colorLabelMap,
    HIGHRACK_550_ALIAS_VIEW_FROM_DATA,
    HIGHRACK_550_ALIAS_DATA_FROM_VIEW
  }), [
    currentUser, cart, adminPrices, allMaterials, inventory, refreshKey,
    updateCurrentCartMaterials, loadAdminPrices, loadAllMaterials,
    generatePartId, getEffectiveUnitPrice, updateAdminPrice,
    updateInventory, getInventoryQuantity, getPartsByRackType, getAllRackTypes,
    extractWeightOnly
  ]);

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error(\'useProducts must be used within a ProductProvider\');
  }
  return context;
};

