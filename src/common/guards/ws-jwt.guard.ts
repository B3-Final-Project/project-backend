import { CanActivate, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: any): boolean {
    console.log('🛡️ Guard WebSocket - canActivate appelé !');
    
    const client = context.switchToWs().getClient();
    console.log('🔍 Guard WebSocket - Début de vérification:', {
      socketId: client.id,
      auth: client.handshake.auth,
      headers: client.handshake.headers
    });
    
    const token = client.handshake.auth.token;

    if (!token) {
      console.error('❌ Guard WebSocket - Pas de token fourni dans auth.token');
      console.log('🔍 Auth complet:', client.handshake.auth);
      return false;
    }

    console.log('🔍 Guard WebSocket - Token trouvé:', token.substring(0, 20) + '...');

    try {
      // Décoder le token sans vérification (pour les tokens AWS Cognito)
      const decoded = this.jwtService.decode(token) as any;
      
      if (!decoded) {
        console.error('❌ Guard WebSocket - Impossible de décoder le token');
        return false;
      }

      console.log('🔍 Guard WebSocket - Token décodé:', {
        sub: decoded.sub,
        username: decoded.username,
        exp: decoded.exp,
        currentTime: Math.floor(Date.now() / 1000)
      });

      // Vérifier l'expiration manuellement
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        console.error('❌ Guard WebSocket - Token expiré');
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
        console.error('❌ Guard WebSocket - Pas d\'userId trouvé dans le payload');
        return false;
      }

      // Stocker les informations d'authentification dans le client
      client.handshake.auth.userId = userId;
      client.handshake.auth.groups = decoded.groups || [];

      console.log('✅ Guard WebSocket - Authentification réussie:', {
        userId,
        groups: decoded.groups || []
      });

      return true;
    } catch (error) {
      console.error('❌ Guard WebSocket - Erreur lors du décodage du token:', error);
      return false;
    }
  }
} 