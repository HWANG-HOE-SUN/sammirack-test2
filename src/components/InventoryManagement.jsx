import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/ApiService';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    material_type: '',
    low_stock: false,
    search: ''
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    transaction_type: '입고',
    quantity: '',
    reference_type: '구매',
    reference_id: '',
    note: ''
  });

  const api = new ApiService();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [filter, materials]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryData, materialsData] = await Promise.all([
        api.getInventory(),
        api.getMaterials()
      ]);
      
      setInventory(inventoryData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    if (filter.material_type) {
      filtered = filtered.filter(item => item.material_type === filter.material_type);
    }

    if (filter.low_stock) {
      filtered = filtered.filter(item => item.is_low_stock === 1);
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.material_name?.toLowerCase().includes(searchTerm) ||
        item.material_code?.toLowerCase().includes(searchTerm) ||
        item.specification?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    
    if (!selectedInventory || !transactionForm.quantity) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    try {
      await api.addInventoryTransaction({
        material_id: selectedInventory.material_id,
        specification: selectedInventory.specification || '',
        transaction_type: transactionForm.transaction_type,
        quantity: parseFloat(transactionForm.quantity),
        reference_type: transactionForm.reference_type,
        reference_id: transactionForm.reference_id,
        note: transactionForm.note,
        created_by: 'admin' // 실제로는 로그인된 사용자
      });

      alert('재고 거래가 성공적으로 처리되었습니다.');
      setShowTransactionModal(false);
      setTransactionForm({
        transaction_type: '입고',
        quantity: '',
        reference_type: '구매',
        reference_id: '',
        note: ''
      });
      loadData(); // 데이터 새로고침
    } catch (error) {
      console.error('재고 거래 실패:', error);
      alert(`재고 거래 실패: ${error.message}`);
    }
  };

  const openTransactionModal = (inventoryItem) => {
    setSelectedInventory(inventoryItem);
    setShowTransactionModal(true);
  };

  const getStockStatusColor = (item) => {
    if (item.current_stock <= 0) return '#dc3545'; // 빨강 - 재고 없음
    if (item.is_low_stock) return '#ffc107'; // 노랑 - 재고 부족
    return '#28a745'; // 초록 - 정상
  };

  const getStockStatusText = (item) => {
    if (item.current_stock <= 0) return '재고없음';
    if (item.is_low_stock) return '부족';
    return '정상';
  };

  const filteredInventory = filterInventory();
  const materialTypes = [...new Set(materials.map(m => m.material_type))];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>📦 재고 관리</h1>
        <p style={{ margin: 0, color: '#666' }}>원자재 재고 현황 및 입출고 관리</p>
      </div>

      {/* 통계 요약 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px' 
      }}>
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2' }}>
            {filteredInventory.length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>총 재고 항목</div>
        </div>
        
        <div style={{
          backgroundColor: '#fff3e0',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f57c00' }}>
            {filteredInventory.filter(item => item.is_low_stock).length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>재고 부족</div>
        </div>
        
        <div style={{
          backgroundColor: '#ffebee',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d32f2f' }}>
            {filteredInventory.filter(item => item.current_stock <= 0).length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>재고 없음</div>
        </div>
        
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#388e3c' }}>
            {filteredInventory.filter(item => !item.is_low_stock && item.current_stock > 0).length}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>정상 재고</div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              재료 유형
            </label>
            <select
              value={filter.material_type}
              onChange={(e) => setFilter({ ...filter, material_type: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">전체</option>
              {materialTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              검색
            </label>
            <input
              type="text"
              placeholder="재료명, 코드, 규격 검색..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={filter.low_stock}
                onChange={(e) => setFilter({ ...filter, low_stock: e.target.checked })}
              />
              재고 부족만 표시
            </label>
          </div>

          <div>
            <button
              onClick={loadData}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 재고 목록 테이블 */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          overflowX: 'auto',
          maxHeight: '600px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  상태
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  재료명
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  코드
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  규격
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                  현재재고
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                  최소재고
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                  최대재고
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  창고위치
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#666' 
                  }}>
                    조건에 맞는 재고 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, index) => (
                  <tr key={index} style={{ 
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: item.is_low_stock ? '#fff3cd' : 'white'
                  }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: getStockStatusColor(item)
                      }}>
                        {getStockStatusText(item)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {item.material_name}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                      {item.material_code}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {item.specification || '-'}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: getStockStatusColor(item)
                    }}>
                      {item.current_stock.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {item.minimum_stock.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {item.maximum_stock.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {item.warehouse_location || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => openTransactionModal(item)}
                        style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        입출고
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 입출고 모달 */}
      {showTransactionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '600px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>
              📦 재고 입출고 - {selectedInventory?.material_name}
            </h3>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '4px', 
              marginBottom: '20px' 
            }}>
              <div><strong>재료코드:</strong> {selectedInventory?.material_code}</div>
              <div><strong>규격:</strong> {selectedInventory?.specification || '표준'}</div>
              <div><strong>현재재고:</strong> {selectedInventory?.current_stock.toLocaleString()}</div>
            </div>

            <form onSubmit={handleTransaction}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  거래 유형 *
                </label>
                <select
                  value={transactionForm.transaction_type}
                  onChange={(e) => setTransactionForm({ 
                    ...transactionForm, 
                    transaction_type: e.target.value 
                  })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ddd' 
                  }}
                  required
                >
                  <option value="입고">입고</option>
                  <option value="출고">출고</option>
                  <option value="조정">조정</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  수량 * {transactionForm.transaction_type === '출고' && '(출고시 음수 자동 적용)'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={transactionForm.quantity}
                  onChange={(e) => setTransactionForm({ 
                    ...transactionForm, 
                    quantity: e.target.value 
                  })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ddd' 
                  }}
                  required
                  min="0"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  참조 유형
                </label>
                <select
                  value={transactionForm.reference_type}
                  onChange={(e) => setTransactionForm({ 
                    ...transactionForm, 
                    reference_type: e.target.value 
                  })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ddd' 
                  }}
                >
                  <option value="구매">구매</option>
                  <option value="판매">판매</option>
                  <option value="생산">생산</option>
                  <option value="조정">조정</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  참조 번호
                </label>
                <input
                  type="text"
                  placeholder="주문번호, 구매번호 등"
                  value={transactionForm.reference_id}
                  onChange={(e) => setTransactionForm({ 
                    ...transactionForm, 
                    reference_id: e.target.value 
                  })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ddd' 
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  비고
                </label>
                <textarea
                  placeholder="거래 관련 메모"
                  value={transactionForm.note}
                  onChange={(e) => setTransactionForm({ 
                    ...transactionForm, 
                    note: e.target.value 
                  })}
                  rows="3"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ddd',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: transactionForm.transaction_type === '출고' ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {transactionForm.transaction_type} 처리
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
