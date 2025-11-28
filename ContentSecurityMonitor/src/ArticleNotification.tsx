/**
 * ArticleNotification.tsx
 * Article notification component for the Content Security Monitor app
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import colors from './colors';
import StorageService, {ArticleNotification} from './StorageService';

interface ArticleNotificationProps {
  visible: boolean;
  onClose: () => void;
}

const ArticleNotificationModal: React.FC<ArticleNotificationProps> = ({
  visible,
  onClose,
}) => {
  const [articles, setArticles] = useState<ArticleNotification[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleNotification | null>(null);

  useEffect(() => {
    if (visible) {
      loadArticles();
    }
  }, [visible]);

  const loadArticles = async () => {
    try {
      const loadedArticles = await StorageService.getArticleNotifications();
      setArticles(loadedArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
      Alert.alert('Error', 'Failed to load articles');
    }
  };

  const markAsRead = async (articleId: string) => {
    try {
      await StorageService.markArticleAsRead(articleId);
      loadArticles(); // Refresh the list
    } catch (error) {
      console.error('Error marking article as read:', error);
      Alert.alert('Error', 'Failed to mark article as read');
    }
  };

  const deleteArticle = async (articleId: string) => {
    try {
      const updatedArticles = articles.filter(article => article.id !== articleId);
      // We don't have a delete method in StorageService, so we'll mark as read instead
      await StorageService.markArticleAsRead(articleId);
      setArticles(updatedArticles);
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error deleting article:', error);
      Alert.alert('Error', 'Failed to delete article');
    }
  };

  const renderArticlePreview = (article: ArticleNotification) => {
    const categoryColors: Record<string, string> = {
      anti_addiction: colors.accent,
      cybersecurity: colors.primary,
      parental_control: colors.secondary,
    };

    const categoryLabels: Record<string, string> = {
      anti_addiction: 'Anti-Addiction',
      cybersecurity: 'Cybersecurity',
      parental_control: 'Parental Control',
    };

    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() => setSelectedArticle(article)}>
        <View style={styles.articleHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColors[article.category] || colors.primary }]}>
            <Text style={styles.categoryText}>
              {categoryLabels[article.category] || article.category}
            </Text>
          </View>
          {!article.read && <View style={styles.unreadIndicator} />}
        </View>
        <Text style={styles.articleTitle}>{article.title}</Text>
        <Text style={styles.articlePreview} numberOfLines={2}>
          {article.content}
        </Text>
        <Text style={styles.articleDate}>
          {new Date(article.timestamp).toLocaleDateString()}
        </Text>
        <View style={styles.articleActions}>
          {!article.read && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => markAsRead(article.id)}>
              <Text style={styles.actionButtonText}>Mark as Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      transparent={false}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Security Articles & Tips</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {selectedArticle ? (
          // Article Detail View
          <ScrollView style={styles.content}>
            <View style={styles.articleDetail}>
              <View style={styles.articleDetailHeader}>
                <View style={[styles.categoryBadge, { 
                  backgroundColor: selectedArticle.category === 'anti_addiction' ? colors.accent :
                                  selectedArticle.category === 'cybersecurity' ? colors.primary :
                                  colors.secondary
                }]}>
                  <Text style={styles.categoryText}>
                    {selectedArticle.category === 'anti_addiction' ? 'Anti-Addiction' :
                     selectedArticle.category === 'cybersecurity' ? 'Cybersecurity' :
                     'Parental Control'}
                  </Text>
                </View>
                <Text style={styles.articleDetailDate}>
                  {new Date(selectedArticle.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.articleDetailTitle}>{selectedArticle.title}</Text>
              <Text style={styles.articleDetailContent}>{selectedArticle.content}</Text>
            </View>
          </ScrollView>
        ) : (
          // Article List View
          <ScrollView style={styles.content}>
            {articles.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No articles available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Cybersecurity articles and tips will appear here
                </Text>
              </View>
            ) : (
              articles.map(renderArticlePreview)
            )}
          </ScrollView>
        )}

        {/* Navigation Footer */}
        <View style={styles.footer}>
          {selectedArticle ? (
            <>
              <TouchableOpacity 
                style={styles.footerButton} 
                onPress={() => setSelectedArticle(null)}>
                <Text style={styles.footerButtonText}>Back to List</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.footerButton, styles.deleteButton]} 
                onPress={() => deleteArticle(selectedArticle.id)}>
                <Text style={styles.footerButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.footerButton} 
              onPress={onClose}>
              <Text style={styles.footerButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  articleCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  articlePreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  articleDate: {
    fontSize: 12,
    color: colors.textDisabled,
  },
  articleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  articleDetail: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  articleDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  articleDetailDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  articleDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  articleDetailContent: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
  },
  footerButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: colors.accent,
  },
  footerButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ArticleNotificationModal;