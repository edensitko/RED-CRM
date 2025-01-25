import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lead } from '../types/schemas';
import { useAuth } from '../contexts/AuthContext';
import { leadService } from '../services/firebase/leadService';
import LeadModal from '../components/modals/LeadModal';
import { FaSearch, FaPlus, FaFilter } from 'react-icons/fa';

const Leads: React.FC = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Lead | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchLeads();
    }
  }, [currentUser]);

  useEffect(() => {
    let filtered = [...leads];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((lead) =>
        Object.values(lead).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((lead) => lead.status === filterStatus);
    }

    // Sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const valueA = a[sortColumn] ?? '';
        const valueB = b[sortColumn] ?? '';
        
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, filterStatus, sortColumn, sortDirection]);

  const fetchLeads = async () => {
    try {
      const fetchedLeads = await leadService.getLeads();
      setLeads(fetchedLeads);
      setFilteredLeads(fetchedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: keyof Lead) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleAddLead = async (lead: Lead) => {
    try {
      const newLead = await leadService.createLead(lead);
      fetchLeads();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding lead:', error);
      alert(`Failed to add lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateLead = async (lead: Lead) => {
    try {
      console.log('Attempting to update lead:', lead);
      if (!lead.id) {
        throw new Error('Lead must have a valid ID for updating');
      }
      await leadService.updateLead(lead.id, lead);
      fetchLeads();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      alert(`Failed to update lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק ליד זה?')) {
      try {
        console.log('Attempting to delete lead:', lead);
        if (!lead.id) {
          throw new Error('Lead must have a valid ID for deletion');
        }
        await leadService.deleteLead(lead.id);
        fetchLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert(`Failed to delete lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'חדש':
        return 'bg-blue-500/20 text-blue-500';
      case 'בתהליך':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'סגור':
        return 'bg-green-500/20 text-green-500';
      case 'לא רלוונטי':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 w-full md:w-auto">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לידים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#252525] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-40 bg-[#252525] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">כל הסטטוסים</option>
                <option value="חדש">חדש</option>
                <option value="בתהליך">בתהליך</option>
                <option value="סגור">סגור</option>
                <option value="לא רלוונטי">לא רלוונטי</option>
              </select>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <FaPlus />
              ליד חדש
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-[#252525] rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2a2a2a]">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    שם
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    חברה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    טלפון
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    אימייל
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    תקציב
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {filteredLeads.map((lead) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[#2a2a2a] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ₪{lead.budget}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsEditModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead)}
                          className="text-red-400 hover:text-red-500 transition-colors"
                        >
                          מחק
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLead}
        userId={currentUser?.uid || ''}
      />

      <LeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateLead}
        onDelete={handleDeleteLead} 
        
        lead={selectedLead}
        userId={currentUser?.uid || ''}
      />
    </div>
  );
};

export default Leads;
