import { CanActivate, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: any): boolean {
    this.logger.log('🛡️ Guard WebSocket - canActivate appelé !');
    
    const client = context.switchToWs().getClient();
    this.logger.debug(`🔍 Guard WebSocket - Début de vérification - socketId: ${client.id}`);
    
    const token = client.handshake.auth.token;

    if (!token) {
      this.logger.error('❌ Guard WebSocket - Pas de token fourni dans auth.token');
      this.logger.debug(`🔍 Auth complet: ${JSON.stringify(client.handshake.auth)}`);
      return false;
    }

    this.logger.debug(`🔍 Guard WebSocket - Token trouvé: ${token.substring(0, 20)}...`);

    try {
      // Décoder le token sans vérification (pour les tokens AWS Cognito)
      const decoded = this.jwtService.decode(token);
      
      if (!decoded || typeof decoded !== 'object') {
        this.logger.error('❌ Guard WebSocket - Impossible de décoder le token');
        return false;
      }

      this.logger.debug(`🔍 Guard WebSocket - Token décodé - sub: ${decoded.sub}, username: ${decoded.username}, exp: ${decoded.exp}, currentTime: ${Math.floor(Date.now() / 1000)}`);

      // Vérifier l'expiration manuellement
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        this.logger.error('❌ Guard WebSocket - Token expiré');
        return false;
      }

      // Extraire l'ID utilisateur depuis le payload
      let userId: string;
      
      // Pour les utilisateurs Google, utiliser le 'sub' qui correspond au user_id en base
      if (decoded.sub) {
        userId = decoded.sub;
      } else if (decoded.username) {
        // Fallback pour les autres types d'utilisateurs
        userId = decoded.username;
      } else {
        this.logger.error('❌ Guard WebSocket - Pas d\'userId trouvé dans le payload');
        return false;
      }

      // Stocker les informations d'authentification dans le client
      client.handshake.auth.userId = userId;
      client.handshake.auth.groups = decoded.groups ?? [];

      this.logger.log(`✅ Guard WebSocket - Authentification réussie - userId: ${userId}, groups: ${(decoded.groups ?? []).join(', ')}`);

      return true;
    } catch (error) {
      this.logger.error(`❌ Guard WebSocket - Erreur lors du décodage du token: ${error.message}`);
      return false;
    }
  }
} 