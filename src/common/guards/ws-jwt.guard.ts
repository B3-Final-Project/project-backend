import { CanActivate, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: any): boolean {
    const client = context.switchToWs().getClient();

    const token = client.handshake.auth.token;

    if (!token) {
      this.logger.error(
        '❌ Guard WebSocket - Pas de token fourni dans auth.token',
      );
      return false;
    }

    try {
      // Décoder le token sans vérification (pour les tokens AWS Cognito)
      const decoded = this.jwtService.decode(token);

      if (!decoded || typeof decoded !== 'object') {
        this.logger.error(
          '❌ Guard WebSocket - Impossible de décoder le token',
        );
        return false;
      }

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
        this.logger.error(
          "❌ Guard WebSocket - Pas d'userId trouvé dans le payload",
        );
        return false;
      }

      // Stocker les informations d'authentification dans le client
      client.handshake.auth.userId = userId;
      client.handshake.auth.groups = decoded.groups ?? [];

      return true;
    } catch (error) {
      this.logger.error(
        `❌ Guard WebSocket - Erreur lors du décodage du token: ${error.message}`,
      );
      return false;
    }
  }
}
