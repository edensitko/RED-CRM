import { getDatabase, ref, push, update, remove, onValue, query, orderByChild } from 'firebase/database';
import { Sale } from '../../types/sales';

export const salesService = {
  async addSale(saleData: Omit<Sale, 'id'>): Promise<string> {
    const db = getDatabase();
    const salesRef = ref(db, 'sales');
    const newSaleRef = push(salesRef);
    await update(newSaleRef, saleData);
    return newSaleRef.key || '';
  },

  async updateSale(saleId: string, saleData: Partial<Sale>): Promise<void> {
    const db = getDatabase();
    const saleRef = ref(db, `sales/${saleId}`);
    await update(saleRef, saleData);
  },

  async deleteSale(saleId: string): Promise<void> {
    const db = getDatabase();
    const saleRef = ref(db, `sales/${saleId}`);
    await remove(saleRef);
  },

  getSales(callback: (sales: Sale[]) => void, errorCallback?: (error: Error) => void) {
    const db = getDatabase();
    const salesRef = ref(db, 'sales');
    
    return onValue(salesRef, (snapshot) => {
      const salesData: Sale[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        salesData.push({
          id: child.key || '',
          customer: data.customer || '',
          customerId: data.customerId || '',
          productName: data.productName || '',
          amount: data.amount || 0,
          status: ['טיוטא', 'מו"מ', 'סגור'].includes(data.status) ? data.status : 'טיוטא',
          priority: ['נמוך', 'בינוני', 'גבוה'].includes(data.priority) ? data.priority : 'בינוני',
          expectedCloseDate: data.expectedCloseDate || '',
          actualCloseDate: data.actualCloseDate || null,
          notes: data.notes || '',
          title: data.title || '',
          owner: data.owner || '',
          stage: data.stage || 'initial',
          probability: data.probability || 0
        } as Sale);
      });
      callback(salesData);
    }, (error) => {
      if (errorCallback) {
        errorCallback(error as Error);
      }
    });
  },

  getSalesByStatus(status: Sale['status'], callback: (sales: Sale[]) => void) {
    const db = getDatabase();
    const salesRef = query(ref(db, 'sales'), orderByChild('status'));
    
    return onValue(salesRef, (snapshot) => {
      const salesData: Sale[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        if (data.status === status) {
          salesData.push({
            id: child.key || '',
            customer: data.customer || '',
            customerId: data.customerId || '',
            productName: data.productName || '',
            amount: data.amount || 0,
            status: data.status || 'pending',
            priority: ['נמוך', 'בינוני', 'גבוה'].includes(data.priority) ? data.priority : 'בינוני',
            expectedCloseDate: data.expectedCloseDate || '',
            actualCloseDate: data.actualCloseDate || null,
            notes: data.notes || '',
            title: data.title || '',
            owner: data.owner || '',
            stage: data.stage || 'initial',
            probability: data.probability || 0
          } as Sale);
        }
      });
      callback(salesData);
    });
  }
};
