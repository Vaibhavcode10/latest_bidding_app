import React, { useState } from 'react';
import { useBiddingRequest } from '../../context/BiddingRequestContext';
import { BiddingRequestStatus } from '../../types';
import { formatPrice } from '../../utils/formatPrice';

const AuctionRequests: React.FC = () => {
  const { requests, approveRequest, rejectRequest, addPlayerToAuction } = useBiddingRequest();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [auctionId, setAuctionId] = useState('');
  const [showAddToAuctionModal, setShowAddToAuctionModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<BiddingRequestStatus | 'ALL'>('ALL');

  const pendingRequests = requests.filter((req) => req.status === BiddingRequestStatus.PENDING);
  const approvedRequests = requests.filter((req) => req.status === BiddingRequestStatus.APPROVED);
  const rejectedRequests = requests.filter((req) => req.status === BiddingRequestStatus.REJECTED);
  const auctionRequests = requests.filter((req) => req.status === BiddingRequestStatus.ADDED_TO_AUCTION);

  const getFilteredRequests = () => {
    if (filterStatus === 'ALL') return requests;
    return requests.filter((req) => req.status === filterStatus);
  };

  const handleApprove = (requestId: string) => {
    approveRequest(requestId, 'Admin');
    setSelectedRequest(null);
  };

  const handleReject = (requestId: string) => {
    if (rejectionReason.trim()) {
      rejectRequest(requestId, rejectionReason);
      setRejectionReason('');
      setShowRejectionModal(false);
      setSelectedRequest(null);
    }
  };

  const handleAddToAuction = (requestId: string) => {
    if (auctionId.trim()) {
      addPlayerToAuction(requestId, auctionId);
      setAuctionId('');
      setShowAddToAuctionModal(false);
      setSelectedRequest(null);
    }
  };

  const currentRequest = requests.find((req) => req.id === selectedRequest);

  const getStatusBadgeColor = (status: BiddingRequestStatus) => {
    switch (status) {
      case BiddingRequestStatus.PENDING:
        return 'bg-yellow-600/30 text-yellow-300 border-yellow-600/30';
      case BiddingRequestStatus.APPROVED:
        return 'bg-green-600/30 text-green-300 border-green-600/30';
      case BiddingRequestStatus.REJECTED:
        return 'bg-red-600/30 text-red-300 border-red-600/30';
      case BiddingRequestStatus.ADDED_TO_AUCTION:
        return 'bg-blue-600/30 text-blue-300 border-blue-600/30';
      default:
        return 'bg-slate-600/30 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <h1 className="text-4xl font-black text-white mb-2">Auction Requests</h1>
        <p className="text-slate-400">Manage player bidding requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-yellow-300 text-sm font-semibold">Pending</p>
          <p className="text-4xl font-black text-yellow-400 mt-2">{pendingRequests.length}</p>
        </div>
        <div className="bg-green-600/10 border border-green-600/20 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-green-300 text-sm font-semibold">Approved</p>
          <p className="text-4xl font-black text-green-400 mt-2">{approvedRequests.length}</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-blue-300 text-sm font-semibold">In Auction</p>
          <p className="text-4xl font-black text-blue-400 mt-2">{auctionRequests.length}</p>
        </div>
        <div className="bg-red-600/10 border border-red-600/20 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-red-300 text-sm font-semibold">Rejected</p>
          <p className="text-4xl font-black text-red-400 mt-2">{rejectedRequests.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        {(['ALL', BiddingRequestStatus.PENDING, BiddingRequestStatus.APPROVED, BiddingRequestStatus.ADDED_TO_AUCTION, BiddingRequestStatus.REJECTED] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            {status === 'ALL' ? '📋 All' : status === BiddingRequestStatus.PENDING ? '⏳ Pending' : status === BiddingRequestStatus.APPROVED ? '✓ Approved' : status === BiddingRequestStatus.ADDED_TO_AUCTION ? '🎯 In Auction' : '✗ Rejected'}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {getFilteredRequests().length === 0 ? (
          <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-600 dark:text-slate-400 text-lg">No requests found</p>
          </div>
        ) : (
          getFilteredRequests().map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-gradient-to-r dark:from-slate-900/50 dark:to-slate-800/50 border border-gray-200 dark:border-blue-600/20 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-blue-600/40 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-white">{request.playerName}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getStatusBadgeColor(request.status)}`}>
                      {request.status === BiddingRequestStatus.PENDING && '⏳ PENDING'}
                      {request.status === BiddingRequestStatus.APPROVED && '✓ APPROVED'}
                      {request.status === BiddingRequestStatus.ADDED_TO_AUCTION && '🎯 IN AUCTION'}
                      {request.status === BiddingRequestStatus.REJECTED && '✗ REJECTED'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Role</p>
                      <p className="text-white font-semibold">{request.role}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Sport</p>
                      <p className="text-white font-semibold">{request.sport.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Base Price</p>
                      <p className="text-blue-400 font-bold">₹{formatPrice(request.basePrice)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Requested On</p>
                      <p className="text-white font-semibold">{new Date(request.requestedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {request.rejectionReason && (
                    <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-3 mb-4">
                      <p className="text-red-300 text-sm"><span className="font-bold">Rejection Reason:</span> {request.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedRequest(request.id)}
                  className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all"
                >
                  {request.status === BiddingRequestStatus.PENDING ? 'Review' : 'View'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && currentRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-blue-600/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">{currentRequest.playerName}</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Role</p>
                <p className="text-gray-900 dark:text-white font-semibold">{currentRequest.role}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-1">Sport</p>
                <p className="text-gray-900 dark:text-white font-semibold">{currentRequest.sport.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Base Price</p>
                <p className="text-blue-400 font-bold text-lg">₹{formatPrice(currentRequest.basePrice)}</p>
              </div>
            </div>

            {currentRequest.status === BiddingRequestStatus.PENDING && (
              <div className="space-y-3">
                <button
                  onClick={() => handleApprove(currentRequest.id)}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-all"
                >
                  ✓ Approve Request
                </button>
                <button
                  onClick={() => setShowRejectionModal(true)}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-all"
                >
                  ✗ Reject Request
                </button>
              </div>
            )}

            {currentRequest.status === BiddingRequestStatus.APPROVED && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowAddToAuctionModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
                >
                  🎯 Add to Auction
                </button>
              </div>
            )}

            {currentRequest.status === BiddingRequestStatus.ADDED_TO_AUCTION && (
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                <p className="text-blue-300 font-semibold">✓ Added to Auction</p>
                <p className="text-slate-400 text-sm mt-2">Auction ID: {currentRequest.auctionId}</p>
              </div>
            )}

            {currentRequest.status === BiddingRequestStatus.REJECTED && (
              <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
                <p className="text-red-300 font-semibold">✗ Rejected</p>
                <p className="text-slate-400 text-sm mt-2">Reason: {currentRequest.rejectionReason}</p>
              </div>
            )}

            <button
              onClick={() => setSelectedRequest(null)}
              className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-600/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-4">Reject Request</h2>
            <p className="text-slate-400 mb-4">Please provide a reason for rejection:</p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={4}
            />

            <div className="flex gap-3">
              <button
                onClick={() => handleReject(selectedRequest)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Auction Modal */}
      {showAddToAuctionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-600/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-4">Add to Auction</h2>
            <p className="text-slate-400 mb-4">Select the auction to add this player:</p>

            <input
              type="text"
              value={auctionId}
              onChange={(e) => setAuctionId(e.target.value)}
              placeholder="Enter Auction ID..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => handleAddToAuction(selectedRequest)}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-all"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddToAuctionModal(false);
                  setAuctionId('');
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { AuctionRequests };
export default AuctionRequests;
