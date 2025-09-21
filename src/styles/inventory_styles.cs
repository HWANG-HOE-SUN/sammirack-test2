/* 재고 관리 컴포넌트 스타일 */
.inventory-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.inventory-header h2 {
  color: #333;
  margin: 0;
  font-size: 24px;
}

.inventory-summary {
  display: flex;
  gap: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.summary-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 16px;
  font-weight: bold;
  color: #007bff;
}

.inventory-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.rack-type-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rack-type-selector label {
  font-weight: bold;
  color: #333;
}

.rack-type-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 5px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  width: 250px;
}

.search-button {
  padding: 8px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-button:hover {
  background: #0056b3;
}

.bulk-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.bulk-save-button {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.bulk-save-button:hover {
  background: #218838;
}

.bulk-save-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.bulk-cancel-button {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bulk-cancel-button:hover {
  background: #545b62;
}

.no-selection {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.inventory-table-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
}

.inventory-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: bold;
  color: #333;
  border-bottom: 2px solid #dee2e6;
}

.inventory-table td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.inventory-table tr:hover {
  background: #f8f9fa;
}

.inventory-table tr.editing {
  background: #fff3cd;
}

.price-cell {
  text-align: right;
  font-weight: bold;
  color: #007bff;
}

.quantity-cell {
  text-align: center;
}

.quantity-display {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.quantity-display:hover {
  background: #e9ecef;
}

.quantity-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
}

.quantity-input.editing {
  border-color: #ffc107;
  background: #fff;
}

.value-cell {
  text-align: right;
  font-weight: bold;
  color: #28a745;
}

.actions-cell {
  text-align: center;
}

.edit-actions {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.edit-button, .save-button, .cancel-button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.edit-button {
  background: #007bff;
  color: white;
}

.edit-button:hover {
  background: #0056b3;
}

.edit-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.save-button {
  background: #28a745;
  color: white;
}

.save-button:hover {
  background: #218838;
}

.save-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.cancel-button {
  background: #6c757d;
  color: white;
}

.cancel-button:hover {
  background: #545b62;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.inventory-info {
  margin-top: 20px;
  padding: 15px;
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.info-icon {
  font-size: 20px;
  margin-top: 2px;
}

.info-content {
  flex: 1;
}

.info-title {
  font-weight: bold;
  color: #0066cc;
  margin-bottom: 8px;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  color: #333;
}

.info-list li {
  margin-bottom: 4px;
}

/* 메인 네비게이션 스타일 업데이트 */
.main-navigation {
  display: flex;
  gap: 5px;
}

.nav-tab {
  padding: 10px 20px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  transition: all 0.2s;
}

.nav-tab:hover {
  background: #e9ecef;
  color: #212529;
}

.nav-tab.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .inventory-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .inventory-summary {
    width: 100%;
    justify-content: space-around;
  }

  .inventory-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .search-section {
    justify-content: stretch;
  }

  .search-input {
    flex: 1;
  }

  .bulk-actions {
    margin-left: 0;
    justify-content: center;
  }

  .inventory-table-container {
    overflow-x: auto;
  }

  .inventory-table {
    min-width: 600px;
  }

  .main-navigation {
    flex-wrap: wrap;
    gap: 2px;
  }

  .nav-tab {
    padding: 8px 12px;
    font-size: 12px;
  }
}

