import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/ApiService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRackTypes: 0,
    totalMaterials: 0,
    lowStockItems: 0,
    monthlyEstimates: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  const api = new ApiService();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 통계 데이터 로드
      const dashboardStats = await api.getDashboardStats();
      setStats(dashboardStats);
      
      // 재고 부족 항목 로드
      const lowStock = await api.getInventory({ low_stock: 'true' });
      setLowStockItems(lowStock.slice(0, 10)); // 최대 10개만 표시
      
      // 최근 활동 로드 (견적서, 주문서)
      const recentEstimates = await api.getEstimates({ 
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
      });
      const recentOrders = await api.getOrders({ 
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
      });
      
      // 최근 활동 합치기 및 정렬
      const combined = [
        ...recentEstimates.map(est => ({ ...est, type: 'estimate' })),
        ...recentOrders.map(ord => ({ ...ord, type: 'order' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
      
      setRecentActivity(combined);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
        <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>📊 관리자 대시보드</h1>
        <p style={{ margin: 0, color: '#666' }}>랙 관리 시스템 현황 및 통계</p>
      </div>

      {/* 주요 통계 카드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <StatCard
          title="랙 종류"
          value={stats.totalRackTypes}
          icon="🏗️"
          color="#007bff"
        />
        <StatCard
          title="등록 원자재"
          value={stats.totalMaterials}
          icon="📦"
          color="#28a745"
        />
        <StatCard
          title="재고 부족"
          value={stats.lowStockItems}
          icon="⚠️"
          color="#dc3545"
        />
        <StatCard
          title="월간 견적"
          value={stats.monthlyEstimates}
          icon="📋"
          color="#17a2b8"
        />
        <StatCard
          title="월간 주문"
          value={stats.monthlyOrders}
          icon="🛒"
          color="#6f42c1"
        />
        <StatCard
          title="월간 매출"
          value={formatCurrency(stats.monthlyRevenue)}
          icon="💰"
          color="#fd7e14"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* 재고 부족 알림 */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: '#dc3545', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            ⚠️ 재고 부족 알림
          </h3>
          
          {lowStockItems.length === 0 ? (
            <p style={{ color: '#28a745' }}>✅ 재고 부족 항목이 없습니다.</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {lowStockItems.map((item, index) => (
                <div key={index} style={{
                  padding: '12px',
                  border: '1px solid #fee',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  backgroundColor: '#fff5f5'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {item.material_name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    규격: {item.specification || '표준'} | 
                    현재: {item.current_stock} | 
                    최소: {item.minimum_stock}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={() => window.location.href = '/admin/inventory'}
            style={{
              marginTop: '15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            재고 관리로 이동
          </button>
        </div>

        {/* 최근 활동 */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            color: '#333', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            📈 최근 활동 (7일)
          </h3>
          
          {recentActivity.length === 0 ? (
            <p style={{ color: '#666' }}>최근 활동이 없습니다.</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {recentActivity.map((item, index) => (
                <div key={index} style={{
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: item.type === 'estimate' ? '#007bff' : '#28a745',
                      color: 'white'
                    }}>
                      {item.type === 'estimate' ? '견적' : '주문'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                    {item.type === 'estimate' ? item.estimate_number : item.order_number}
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    고객: {item.customer_name} | 
                    금액: {formatCurrency(item.total_amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 빠른 액션 버튼들 */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>🚀 빠른 액션</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <ActionButton
            title="원자재 관리"
            description="부품 및 가격 관리"
            icon="📦"
            onClick={() => window.location.href = '/admin/materials'}
            color="#007bff"
          />
          <ActionButton
            title="재고 관리"
            description="입출고 및 재고 현황"
            icon="📊"
            onClick={() => window.location.href = '/admin/inventory'}
            color="#28a745"
          />
          <ActionButton
            title="견적서 관리"
            description="견적서 조회 및 관리"
            icon="📋"
            onClick={() => window.location.href = '/admin/estimates'}
            color="#17a2b8"
          />
          <ActionButton
            title="주문서 관리"
            description="주문 처리 및 현황"
            icon="🛒"
            onClick={() => window.location.href = '/admin/orders'}
            color="#6f42c1"
          />
          <ActionButton
            title="랙 구성 관리"
            description="랙 타입 및 옵션 설정"
            icon="🏗️"
            onClick={() => window.location.href = '/admin/configurations'}
            color="#fd7e14"
          />
          <ActionButton
            title="데이터 마이그레이션"
            description="JSON 데이터 가져오기"
            icon="🔄"
            onClick={() => window.location.href = '/admin/migration'}
            color="#6c757d"
          />
        </div>
      </div>
    </div>
  );
};

// 통계 카드 컴포넌트
const StatCard = ({ title, value, icon, color }) => (
  <div style={{
    backgroundColor: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}>
    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
    <div style={{ 
      fontSize: '28px', 
      fontWeight: 'bold', 
      color: color,
      marginBottom: '4px' 
    }}>
      {value}
    </div>
    <div style={{ fontSize: '14px', color: '#666' }}>{title}</div>
  </div>
);

// 액션 버튼 컴포넌트
const ActionButton = ({ title, description, icon, onClick, color }) => (
  <button
    onClick={onClick}
    style={{
      backgroundColor: 'white',
      border: `2px solid ${color}`,
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      width: '100%'
    }}
    onMouseEnter={(e) => {
      e.target.style.backgroundColor = color;
      e.target.style.color = 'white';
    }}
    onMouseLeave={(e) => {
      e.target.style.backgroundColor = 'white';
      e.target.style.color = 'initial';
    }}
  >
    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '14px', opacity: 0.8 }}>{description}</div>
  </button>
);

export default AdminDashboard;
