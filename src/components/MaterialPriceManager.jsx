import React, { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../contexts/ProductContext';
import AdminPriceEditor from './AdminPriceEditor';

// 무게 라벨 변환
function kgLabelFix(str) {
  if (!str) return '';
  return String(str).replace(/200kg/g, '270kg').replace(/350kg/g, '450kg');
}

export default function MaterialPriceManager({ currentUser, cart }) {
  const {
    adminPrices,
    allMaterials,
    refreshKey,
    generatePartId,
    getEffectiveUnitPrice,
    updateAdminPrice,
    loadAdminPrices,
    loadAllMaterials
  } = useProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingPart, setEditingPart] = useState(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadAdminPrices();
    loadAllMaterials();
  }, [loadAdminPrices, loadAllMaterials]);

  // refreshKey 변경 시 데이터 새로고침
  useEffect(() => {
    if (refreshKey > 0) {
      loadAdminPrices();
    }
  }, [refreshKey, loadAdminPrices]);

  // 가격 변경 이벤트 리스너 (기존 이벤트 시스템과의 호환성)
  useEffect(() => {
    const handlePriceChange = (event) => {
      console.log('MaterialPriceManager: 단가 변경 이벤트 수신', event.detail);
      loadAdminPrices();
    };

    window.addEventListener('adminPriceChanged', handlePriceChange);
    return () => {
      window.removeEventListener('adminPriceChanged', handlePriceChange);
    };
  }, [loadAdminPrices]);

  // 검색된 자재 목록
  const filteredMaterials = useMemo(() => {
    const materialsArray = Array.from(allMaterials.values());
    
    if (!searchTerm.trim()) {
      return materialsArray;
    }

    const searchLower = searchTerm.toLowerCase();
    return materialsArray.filter(material => {
      const searchableText = [
        material.rackType,
        material.name,
        material.specification,
        material.partId
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchLower);
    });
  }, [allMaterials, searchTerm]);

  // 단가 수정 핸들러
  const handlePriceEdit = (material) => {
    setEditingPart(material);
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

  return (
    <div className="material-price-manager">
      <div className="manager-header">
        <h2>원자재 단가 관리</h2>
        <div className="search-section">
          <input
            type="text"
            placeholder="부품명, 랙타입, 규격으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="search-button">🔍</button>
        </div>
      </div>

      <div className="materials-table-container">
        <table className="materials-table">
          <thead>
            <tr>
              <th>랙타입</th>
              <th>부품명</th>
              <th>규격</th>
              <th>단가</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-results">
                  "{searchTerm}" 검색 결과: {filteredMaterials.length}개 원자재
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material) => {
                const partId = material.partId;
                const effectivePrice = getEffectiveUnitPrice(material);
                const hasAdminPrice = adminPrices[partId] && adminPrices[partId].price > 0;

                return (
                  <tr key={partId} className={hasAdminPrice ? 'has-admin-price' : ''}>
                    <td>{kgLabelFix(material.rackType)}</td>
                    <td>{material.name}</td>
                    <td>{kgLabelFix(material.specification)}</td>
                    <td className="price-cell">
                      <span className={hasAdminPrice ? 'admin-price' : 'default-price'}>
                        {effectivePrice.toLocaleString()}원
                      </span>
                      {hasAdminPrice && (
                        <span className="price-badge">수정됨</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handlePriceEdit(material)}
                        className="edit-button"
                        disabled={!currentUser}
                      >
                        단가수정
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="info-section">
        <div className="info-icon">💡</div>
        <div className="info-content">
          <div className="info-title">원자재 단가 관리 안내</div>
          <ul className="info-list">
            <li>이곳에서 수정한 단가는 전체 시스템에 적용됩니다.</li>
            <li>"수정됨" 표시가 있는 부품은 관리자가 단가를 수정한 부품입니다.</li>
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

