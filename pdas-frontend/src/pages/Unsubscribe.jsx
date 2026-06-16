import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import axios from "axios";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email || !token) {
      setStatus("error");
      setMessage("Invalid or missing unsubscribe link parameters.");
      return;
    }

    const unsubscribeUser = async () => {
      try {
        const response = await axios.post("http://localhost:5000/api/users/unsubscribe", {
          email,
          token,
        });
        
        if (response.data.success) {
          setStatus("success");
          setMessage("You have successfully unsubscribed from email notifications.");
        } else {
          setStatus("error");
          setMessage(response.data.message || "Failed to unsubscribe. Please try again later.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "An unexpected error occurred while unsubscribing.");
      }
    };

    unsubscribeUser();
  }, [email, token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Processing Request...</h2>
            <p className="text-slate-500 mt-2">Please wait while we update your preferences.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Unsubscribed</h2>
            <p className="text-slate-600 mt-2">{message}</p>
            <p className="text-sm text-slate-500 mt-6">
              You can re-enable notifications at any time from your account settings.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Unsubscribe Failed</h2>
            <p className="text-slate-600 mt-2">{message}</p>
            <div className="mt-8 flex gap-4 w-full justify-center">
              <Link 
                to="/" 
                className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
