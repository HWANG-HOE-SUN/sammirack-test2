import React, { useState, useEffect } from 'react';
import { useProducts } from '../contexts/ProductContext';
import { sortBOMaterialRule } from '../utils/materialSort';
import AdminPriceEditor from './AdminPriceEditor';

// 무게 라벨 변환
function kgLabelFix(str) {
  if (!str) return '';
  return String(str).replace(/200kg/g, '270kg').replace(/350kg/g, '450kg');
}

export default function BOMDisplay({ bom, title, currentUser, selectedRackOption }) {
  const {
    adminPrices,
    refreshKey,
    generatePartId,
    getEffectiveUnitPrice,
    updateAdminPrice,
    loadAdminPrices
  } = useProducts();

  const [setTotalBomQuantity] = useState(0);
  const [editingPart, setEditingPart] = useState(null);
  const [setAdminPrices, setSetAdminPrices] = useState({});
  const [refreshKey, setRefreshKey] = useState(0); // 강제 리렌더링

  // 컴포넌트 마운트 시 관리자 가격 로드
  useEffect(() => {
    loadAdminPrices();
  }, [loadAdminPrices]);

  // refreshKey 변경 시 데이터 새로고침
  useEffect(() => {
    if (refreshKey > 0) {
      loadAdminPrices();
    }
  }, [refreshKey, loadAdminPrices]);

  // 가격 변경 이벤트 리스너
  useEffect(() => {
    const handlePriceChange = (event) => {
      console.log('BOMDisplay: 단가 변경 이벤트 수신', event.detail);
      loadAdminPrices();
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('adminPriceChanged', handlePriceChange);
    return () => {
      window.removeEventListener('adminPriceChanged', handlePriceChange);
    };
  }, [loadAdminPrices]);

  // 부품 고유 ID 생성 (기존 로직과 동일)
  const generatePartId = (item) => {
    const { rackType, name, specification } = item;
    const cleanName = name.replace(/[^\w가-힣]/g, '');
    const cleanSpec = (specification || '').replace(/[^\w가-힣]/g, '');
    return `${rackType}-${cleanName}-${cleanSpec}`.toLowerCase();
  };

  // 실제 사용할 단가 계산 (우선순위: 관리자 수정 단가 > 기본 단가)
  const getEffectiveUnitPrice = (item) => {
    const partId = generatePartId(item);
    const adminPrice = adminPrices[partId];
    
    if (adminPrice && adminPrice.price > 0) {
      return adminPrice.price;
    }
    
    return Number(item.unitPrice ?? 0);
  };

  // 단가 수정 버튼 클릭 핸들러
  const handlePriceEdit = (item) => {
    setEditingPart(item);
  };

  // 단가 저장 핸들러
  const handlePriceSave = (partId, newPrice, reason) => {
    updateAdminPrice(partId, newPrice, reason);
    setEditingPart(null);
  };

  // 편집 취소 핸들러
  const handleEditCancel = () => {
    setEditingPart(null);
  };

  // BOM 데이터가 없는 경우
  if (!bom || !Array.isArray(bom) || bom.length === 0) {
    return (
      <div className="bom-display">
        <h3>{title || '전체 부품 목록 (BOM)'}</h3>
        <div className="no-bom-data">
          선택된 제품에 대한 BOM 데이터가 없습니다.
        </div>
      </div>
    );
  }

  // BOM 데이터 정렬
  const sortedBOM = [...bom].sort(sortBOMaterialRule);

  // 총 금액 계산
  const totalAmount = sortedBOM.reduce((sum, item) => {
    const effectivePrice = getEffectiveUnitPrice(item);
    return sum + (effectivePrice * (item.quantity || 1));
  }, 0);

  return (
    <div className="bom-display">
      <h3>{title || '전체 부품 목록 (BOM)'}</h3>
      
      <div className="bom-table-container">
        <table className="bom-table">
          <thead>
            <tr>
              <th>부품정보</th>
              <th>규격</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {sortedBOM.map((item, index) => {
              const partId = generatePartId(item);
              const effectivePrice = getEffectiveUnitPrice(item);
              const hasAdminPrice = adminPrices[partId] && adminPrices[partId].price > 0;
              const itemTotal = effectivePrice * (item.quantity || 1);

              return (
                <tr key={index} className={hasAdminPrice ? 'has-admin-price' : ''}>
                  <td>
                    <div className="part-info">
                      <span className="part-name">{item.name}</span>
                      {hasAdminPrice && <span className="modified-badge">수정됨</span>}
                    </div>
                  </td>
                  <td>{kgLabelFix(item.specification || item.규격)}</td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity || 1}
                      onChange={(e) => {
                        // 수량 변경 로직 (필요시 구현)
                      }}
                      min="1"
                      className="quantity-input"
                    />
                    개
                  </td>
                  <td className="price-cell">
                    <span className={hasAdminPrice ? 'admin-price' : 'default-price'}>
                      {effectivePrice.toLocaleString()}
                    </span>
                  </td>
                  <td className="amount-cell">
                    {itemTotal.toLocaleString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handlePriceEdit(item)}
                      className="edit-button"
                      disabled={!currentUser}
                    >
                      단가수정
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan="4"><strong>총 합계</strong></td>
              <td><strong>{totalAmount.toLocaleString()}원</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bom-info">
        <div className="info-icon">💡</div>
        <div className="info-content">
          <div className="info-title">현재 단가 수정 정보</div>
          <ul className="info-list">
            <li>"수정됨" 표시가 있는 부품은 관리자가 단가를 수정한 부품입니다.</li>
            <li>단가가 수정된 부품은 다른 견적에서도 같은 가격이 적용됩니다.</li>
            <li>상단 원자재 단가 관리에서 변경 수정이 가능합니다.</li>
          </ul>
        </div>
      </div>

      {/* 단가 편집 모달 */}
      {editingPart && (
        <AdminPriceEditor
          material={editingPart}
          currentPrice={getEffectiveUnitPrice(editingPart)}
          onSave={handlePriceSave}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  );
}

