'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { processCalendarImage } from '@/lib/imageProcessing';

interface ExtractedEvent {
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  description?: string;
}

interface ImageScanButtonProps {
  onEventsExtracted: (events: ExtractedEvent[]) => void;
  className?: string;
}

export function ImageScanButton({ onEventsExtracted, className }: ImageScanButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNetworkIssue, setIsNetworkIssue] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      setIsNetworkIssue(false);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file too large. Please select a file under 10MB.');
      setIsNetworkIssue(false);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setIsNetworkIssue(false);

    try {
      console.log('Processing image for event extraction:', file.name);
      const events = await processCalendarImage(file);
      console.log('Events extracted successfully:', events);
      
      if (events.length === 0) {
        setError('No events found in the image. Try another image with clearer event details, or create your event manually.');
        setIsNetworkIssue(false);
        return;
      }

      onEventsExtracted(events);
    } catch (err) {
      console.error('Error processing image:', err);
      
      if (err instanceof Error) {
        // Check for network-related issues
        const isNetworkError = err.message.includes('network') ||
                              err.message.includes('connectivity') ||
                              err.message.includes('firewall') ||
                              err.message.includes('connect to the AI') ||
                              err.message.includes('unavailable due to');
        
        setIsNetworkIssue(isNetworkError);
        
        if (isNetworkError) {
          setError(err.message);
        } else if (err.message.includes('timeout')) {
          setError('The AI service is taking too long. Please try again or create your event manually.');
          setIsNetworkIssue(false);
        } else if (err.message.includes('API key') || err.message.includes('configuration')) {
          setError('AI service configuration issue. Please create your event manually or contact support.');
          setIsNetworkIssue(false);
        } else {
          setError(err.message);
          setIsNetworkIssue(false);
        }
      } else {
        setError('An unexpected error occurred. Please try again or create your event manually.');
        setIsNetworkIssue(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isProcessing}
      />
      
      <motion.div
        whileHover={{ scale: isProcessing ? 1 : 1.02 }}
        whileTap={{ scale: isProcessing ? 1 : 0.98 }}
      >
        <Button
          onClick={handleButtonClick}
          disabled={isProcessing}
          className={cn(
            "w-full justify-start bg-gradient-to-r from-[#C2EABD] to-[#A3D5FF] hover:from-[#A3D5FF] hover:to-[#C2EABD] text-[#011936] border-0 rounded-lg px-4 py-3 font-medium shadow-md hover:shadow-lg transition-all",
            isProcessing && "opacity-75 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-3 animate-spin" />
              Scanning Image...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-3" />
              Scan Event from Image
            </>
          )}
        </Button>
      </motion.div>

      {/* Processing Animation */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-3"
        >
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
            <span className="text-sm text-blue-700 font-medium">
              AI is analyzing your image...
            </span>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "border rounded-lg p-3",
            isNetworkIssue 
              ? "bg-amber-50 border-amber-200" 
              : "bg-red-50 border-red-200"
          )}
        >
          <div className="flex items-start space-x-3">
            {isNetworkIssue ? (
              <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium",
                isNetworkIssue ? "text-amber-700" : "text-red-700"
              )}>
                {isNetworkIssue ? "AI Service Unavailable" : "Error"}
              </p>
              <p className={cn(
                "text-sm mt-1",
                isNetworkIssue ? "text-amber-600" : "text-red-600"
              )}>
                {error}
              </p>
              {isNetworkIssue && (
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  💡 You can still create events manually using the form below
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className={cn(
                "p-1",
                isNetworkIssue 
                  ? "text-amber-500 hover:text-amber-700" 
                  : "text-red-500 hover:text-red-700"
              )}
            >
              ×
            </Button>
          </div>
        </motion.div>
      )}

      {/* Help Text */}
      {!isProcessing && !error && (
        <p className="text-xs text-gray-500 px-1">
          Upload photos of flyers, tickets, or event invitations to automatically extract event details
        </p>
      )}
    </div>
  );
}