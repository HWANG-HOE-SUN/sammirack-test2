import React, { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../contexts/ProductContext';

// 무게 라벨 변환
function kgLabelFix(str) {
  if (!str) return '';
  return String(str).replace(/200kg/g, '270kg').replace(/350kg/g, '450kg');
}

export default function InventoryManager({ currentUser }) {
  const {
    getAllRackTypes,
    getPartsByRackType,
    updateInventory,
    getInventoryQuantity,
    refreshKey
  } = useProducts();

  const [selectedRackType, setSelectedRackType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuantities, setEditingQuantities] = useState({});

  // 랙 종류 목록 조회
  const rackTypes = useMemo(() => {
    return getAllRackTypes();
  }, [getAllRackTypes, refreshKey]);

  // 첫 번째 랙 종류를 기본 선택
  useEffect(() => {
    if (rackTypes.length > 0 && !selectedRackType) {
      setSelectedRackType(rackTypes[0]);
    }
  }, [rackTypes, selectedRackType]);

  // 선택된 랙 종류의 부품 목록
  const parts = useMemo(() => {
    if (!selectedRackType) return [];
    return getPartsByRackType(selectedRackType);
  }, [selectedRackType, getPartsByRackType, refreshKey]);

  // 검색 필터링된 부품 목록
  const filteredParts = useMemo(() => {
    if (!searchTerm.trim()) return parts;
    
    const searchLower = searchTerm.toLowerCase();
    return parts.filter(part => {
      const searchableText = [
        part.name,
        part.specification,
        part.partId
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchLower);
    });
  }, [parts, searchTerm]);

  // 재고 수량 변경 핸들러
  const handleQuantityChange = (partId, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    setEditingQuantities(prev => ({
      ...prev,
      [partId]: quantity
    }));
  };

  // 재고 수량 저장 핸들러
  const handleQuantitySave = (partId) => {
    const newQuantity = editingQuantities[partId];
    if (newQuantity !== undefined) {
      updateInventory(partId, newQuantity);
      setEditingQuantities(prev => {
        const updated = { ...prev };
        delete updated[partId];
        return updated;
      });
    }
  };

  // 재고 수량 저장 취소 핸들러
  const handleQuantityCancel = (partId) => {
    setEditingQuantities(prev => {
      const updated = { ...prev };
      delete updated[partId];
      return updated;
    });
  };

  // 전체 재고 일괄 업데이트 핸들러
  const handleBulkUpdate = () => {
    Object.entries(editingQuantities).forEach(([partId, quantity]) => {
      updateInventory(partId, quantity);
    });
    setEditingQuantities({});
  };

  // 편집 중인 항목이 있는지 확인
  const hasEditingItems = Object.keys(editingQuantities).length > 0;

  // 총 재고 가치 계산
  const totalInventoryValue = useMemo(() => {
    return filteredParts.reduce((total, part) => {
      const quantity = getInventoryQuantity(part.partId);
      return total + (part.effectivePrice * quantity);
    }, 0);
  }, [filteredParts, getInventoryQuantity]);

  // 총 재고 수량 계산
  const totalInventoryQuantity = useMemo(() => {
    return filteredParts.reduce((total, part) => {
      return total + getInventoryQuantity(part.partId);
    }, 0);
  }, [filteredParts, getInventoryQuantity]);

  return (
    <div className="inventory-manager">
      <div className="inventory-header">
        <h2>재고 관리</h2>
        <div className="inventory-summary">
          <div className="summary-item">
            <span className="summary-label">총 재고 수량:</span>
            <span className="summary-value">{totalInventoryQuantity.toLocaleString()}개</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">총 재고 가치:</span>
            <span className="summary-value">{totalInventoryValue.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      <div className="inventory-controls">
        <div className="rack-type-selector">
          <label htmlFor="rackType">랙 종류:</label>
          <select
            id="rackType"
            value={selectedRackType}
            onChange={(e) => setSelectedRackType(e.target.value)}
            className="rack-type-select"
          >
            <option value="">랙 종류를 선택하세요</option>
            {rackTypes.map(rackType => (
              <option key={rackType} value={rackType}>
                {kgLabelFix(rackType)}
              </option>
            ))}
          </select>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="부품명, 규격으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="search-button">🔍</button>
        </div>

        {hasEditingItems && (
          <div className="bulk-actions">
            <button
              onClick={handleBulkUpdate}
              className="bulk-save-button"
              disabled={!currentUser}
            >
              전체 저장
            </button>
            <button
              onClick={() => setEditingQuantities({})}
              className="bulk-cancel-button"
            >
              전체 취소
            </button>
          </div>
        )}
      </div>

      {!selectedRackType ? (
        <div className="no-selection">
          랙 종류를 선택해주세요.
        </div>
      ) : (
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>부품명</th>
                <th>규격</th>
                <th>단가</th>
                <th>재고 수량</th>
                <th>재고 가치</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-results">
                    {searchTerm ? 
                      `"${searchTerm}" 검색 결과가 없습니다.` : 
                      `${kgLabelFix(selectedRackType)}에 해당하는 부품이 없습니다.`
                    }
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => {
                  const partId = part.partId;
                  const currentQuantity = getInventoryQuantity(partId);
                  const editingQuantity = editingQuantities[partId];
                  const isEditing = editingQuantity !== undefined;
                  const displayQuantity = isEditing ? editingQuantity : currentQuantity;
                  const inventoryValue = part.effectivePrice * displayQuantity;

                  return (
                    <tr key={partId} className={isEditing ? 'editing' : ''}>
                      <td>{part.name}</td>
                      <td>{kgLabelFix(part.specification)}</td>
                      <td className="price-cell">
                        {part.effectivePrice.toLocaleString()}원
                      </td>
                      <td className="quantity-cell">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingQuantity}
                            onChange={(e) => handleQuantityChange(partId, e.target.value)}
                            min="0"
                            className="quantity-input editing"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="quantity-display"
                            onClick={() => currentUser && handleQuantityChange(partId, currentQuantity)}
                          >
                            {currentQuantity.toLocaleString()}개
                          </span>
                        )}
                      </td>
                      <td className="value-cell">
                        {inventoryValue.toLocaleString()}원
                      </td>
                      <td className="actions-cell">
                        {isEditing ? (
                          <div className="edit-actions">
                            <button
                              onClick={() => handleQuantitySave(partId)}
                              className="save-button"
                              disabled={!currentUser}
                            >
                              저장
                            </button>
                            <button
                              onClick={() => handleQuantityCancel(partId)}
                              className="cancel-button"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleQuantityChange(partId, currentQuantity)}
                            className="edit-button"
                            disabled={!currentUser}
                          >
                            수정
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="inventory-info">
        <div className="info-icon">💡</div>
        <div className="info-content">
          <div className="info-title">재고 관리 안내</div>
          <ul className="info-list">
            <li>각 랙 종류별로 부품의 재고 수량을 관리할 수 있습니다.</li>
            <li>재고 수량을 클릭하면 직접 수정할 수 있습니다.</li>
            <li>재고 가치는 현재 단가 × 재고 수량으로 자동 계산됩니다.</li>
            <li>변경된 재고 정보는 브라우저에 자동 저장됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

