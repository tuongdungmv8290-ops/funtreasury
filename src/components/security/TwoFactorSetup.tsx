import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Shield, 
  Smartphone, 
  Key,
  Check,
  Copy,
  AlertTriangle
} from 'lucide-react';

export const TwoFactorSetup = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Mock secret for demo (in production, this would come from backend)
  const mockSecret = 'JBSWY3DPEHPK3PXP';
  const mockOTPAuthURL = `otpauth://totp/FUN%20Treasury:admin@treasury.fun.rich?secret=${mockSecret}&issuer=FUN%20Treasury`;

  const handleEnable2FA = () => {
    setShowSetup(true);
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    
    // Simulate verification (in production, verify against backend)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (verificationCode.length === 6) {
      setIs2FAEnabled(true);
      setShowSetup(false);
      setVerificationCode('');
      toast.success('🔐 2FA đã được kích hoạt thành công!');
    } else {
      toast.error('Mã xác thực không hợp lệ');
    }
    
    setIsVerifying(false);
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    toast.success('2FA đã được tắt');
  };

  const copySecret = () => {
    navigator.clipboard.writeText(mockSecret);
    toast.success('Đã copy secret key!');
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>Bảo mật tài khoản với Google Authenticator</CardDescription>
            </div>
          </div>
          <Badge 
            variant={is2FAEnabled ? "default" : "secondary"}
            className={is2FAEnabled ? "bg-green-500/20 text-green-500 border-green-500/50" : ""}
          >
            {is2FAEnabled ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Enabled
              </>
            ) : (
              'Disabled'
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!showSetup ? (
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Google Authenticator</p>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled 
                    ? 'Bảo mật 2 lớp đang hoạt động' 
                    : 'Thêm lớp bảo mật cho tài khoản admin'}
                </p>
              </div>
            </div>
            {is2FAEnabled ? (
              <Button variant="destructive" size="sm" onClick={handleDisable2FA}>
                Disable
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                onClick={handleEnable2FA}
              >
                Enable 2FA
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Quét mã QR bằng Google Authenticator hoặc nhập secret key thủ công
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* QR Code */}
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <QRCodeSVG 
                  value={mockOTPAuthURL} 
                  size={160}
                  level="H"
                  includeMargin
                />
              </div>

              {/* Manual Setup */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Hoặc nhập thủ công trong app:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-secondary rounded-lg font-mono text-sm break-all">
                      {mockSecret}
                    </code>
                    <Button variant="ghost" size="icon" onClick={copySecret}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Nhập mã 6 số từ app
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="font-mono text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                    <Button 
                      onClick={handleVerifyCode}
                      disabled={verificationCode.length !== 6 || isVerifying}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setShowSetup(false)}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Security Tips */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            💡 2FA bảo vệ tài khoản admin khỏi truy cập trái phép. Mỗi lần đăng nhập sẽ yêu cầu mã từ Google Authenticator.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
