"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { Booking } from "@/lib/api/types";
import { QRCodeSVG } from "qrcode.react";
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Car, 
  Navigation, 
  Share2, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  XCircle,
  Star
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function BookingPassPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Review state if completed
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchBooking = async () => {
    try {
      const res = await apiClient.get(`/bookings/${id}`);
      setBooking(res.data);
    } catch (err) {
      toast.error("Failed to load booking details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setIsCancelling(true);
    try {
      await apiClient.delete(`/bookings/${id}`, {
        data: { reason: "Cancelled by driver" },
      });
      toast.success("Booking cancelled");
      fetchBooking();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      await apiClient.post("/reviews", {
        booking_id: id,
        rating,
        comment,
      });
      toast.success("Review submitted! Thank you.");
      setComment("");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading || !booking) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const location = booking.parking_location;
  const isConfirmed = booking.status === "CONFIRMED";
  const isCheckedIn = booking.status === "CHECKED_IN";
  const isCompleted = booking.status === "COMPLETED";

  return (
    <div className="max-w-xl mx-auto w-full p-4 space-y-6">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> My Bookings
      </Link>

      {/* Digital Parking Pass Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header */}
        <div className={`p-6 text-white text-center space-y-2 ${
          isConfirmed ? "bg-emerald-600" : isCheckedIn ? "bg-blue-600" : isCompleted ? "bg-slate-800" : "bg-rose-600"
        }`}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            {booking.status}
          </div>
          <h1 className="text-2xl font-black">{booking.booking_ref}</h1>
          <p className="text-xs text-white/80">Scan this QR pass at the security entry gate</p>
        </div>

        {/* QR Code section */}
        <div className="p-8 flex flex-col items-center justify-center bg-slate-50 border-b border-dashed border-slate-200">
          <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200">
            <QRCodeSVG
              value={booking.qr_token}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-3">
            Pass ID: {booking.qr_token.slice(0, 16)}...
          </span>
        </div>

        {/* Booking Details Grid */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase">Parking Location</span>
              <div className="font-bold text-slate-900 text-sm">{location?.name || "Mumbai Parking"}</div>
              <p className="text-slate-500 line-clamp-1">{location?.address}</p>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-slate-400 font-semibold uppercase">Bay Allocated</span>
              <div className="font-black text-blue-600 text-lg">
                Bay {booking.space?.space_number || "A-01"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase">Scheduled Time</span>
              <div className="font-bold text-slate-800">
                {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{" "}
                {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-slate-500">
                {new Date(booking.start_time).toLocaleDateString()}
              </div>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-slate-400 font-semibold uppercase">Vehicle Plate</span>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {booking.vehicle?.plate_number || "MH 01"}
              </div>
              <div className="text-slate-500 capitalize">
                {booking.vehicle?.make} {booking.vehicle?.model}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <span className="font-semibold text-slate-500">Total Paid</span>
            <span className="font-black text-slate-900 text-base">
              ₹{Math.round(booking.total_price)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5">
          {location?.latitude && location?.longitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Navigation className="w-4 h-4" />
              Navigate with Google Maps
            </a>
          )}

          {isConfirmed && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full py-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancel Reservation &amp; Refund
            </button>
          )}
        </div>
      </div>

      {/* Review Section if Completed */}
      {isCompleted && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">How was your parking experience?</h3>
          <form onSubmit={handleReview} className="space-y-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-500"
                >
                  <Star className={`w-5 h-5 ${star <= rating ? "fill-amber-500" : ""}`} />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600">{rating} Stars</span>
            </div>

            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was it easy to find? Clean bay? Helpful security?"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
            />

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50"
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
