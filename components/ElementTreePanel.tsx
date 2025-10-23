'use client';

import { useEffect, useState } from 'react';
import { SelectedElement } from '@/lib/types';
import { ChevronRight, ChevronDown, Image as ImageIcon, Type, Box } from 'lucide-react';

interface TreeElement {
  id: string;
  tagName: string;
  isImage: boolean;
  isText: boolean;
  element: HTMLElement;
  children: TreeElement[];
}

interface ElementTreePanelProps {
  htmlContent: string;
  selectedElement: SelectedElement | null;
  onSelect: (element: SelectedElement) => void;
  stageRef: HTMLDivElement | null;
}

export function ElementTreePanel({ htmlContent, selectedElement, onSelect, stageRef }: ElementTreePanelProps) {
  const [treeData, setTreeData] = useState<TreeElement[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!stageRef) return;

    const buildTree = (container: HTMLElement): TreeElement[] => {
      const elements: TreeElement[] = [];

      Array.from(container.children).forEach((child) => {
        const htmlChild = child as HTMLElement;
        if (!htmlChild.id) return;

        const isImage = htmlChild.tagName.toLowerCase() === 'img';
        const isText = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'].includes(htmlChild.tagName.toLowerCase()) && !isImage;

        const treeElement: TreeElement = {
          id: htmlChild.id,
          tagName: htmlChild.tagName,
          isImage,
          isText,
          element: htmlChild,
          children: buildTree(htmlChild),
        };

        elements.push(treeElement);
      });

      return elements;
    };

    const tree = buildTree(stageRef);
    setTreeData(tree);

    const allIds = new Set<string>();
    const collectIds = (elements: TreeElement[]) => {
      elements.forEach((el) => {
        allIds.add(el.id);
        collectIds(el.children);
      });
    };
    collectIds(tree);
    setExpandedNodes(allIds);
  }, [htmlContent, stageRef]);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleElementClick = (treeElement: TreeElement) => {
    const selection: SelectedElement = {
      id: treeElement.id,
      element: treeElement.element,
      tagName: treeElement.tagName,
      isImage: treeElement.isImage,
      isText: treeElement.isText,
    };
    onSelect(selection);
  };

  const getElementIcon = (treeElement: TreeElement) => {
    if (treeElement.isImage) {
      return <ImageIcon className="w-4 h-4 text-green-400" />;
    }
    if (treeElement.isText) {
      return <Type className="w-4 h-4 text-blue-400" />;
    }
    return <Box className="w-4 h-4 text-slate-400" />;
  };

  const getElementLabel = (treeElement: TreeElement) => {
    const tagName = treeElement.tagName.toLowerCase();
    if (treeElement.isText && treeElement.element.textContent) {
      const preview = treeElement.element.textContent.slice(0, 20);
      return `${tagName} - "${preview}${treeElement.element.textContent.length > 20 ? '...' : ''}"`;
    }
    if (treeElement.isImage) {
      return `${tagName} - image`;
    }
    return tagName;
  };

  const renderTree = (elements: TreeElement[], depth: number = 0) => {
    return elements.map((treeElement) => {
      const isExpanded = expandedNodes.has(treeElement.id);
      const isSelected = selectedElement?.id === treeElement.id;
      const hasChildren = treeElement.children.length > 0;

      return (
        <div key={treeElement.id} style={{ marginLeft: `${depth * 12}px` }}>
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-700/50 transition-colors ${
              isSelected ? 'bg-blue-600/30 text-blue-300' : 'text-slate-300'
            }`}
            onClick={() => handleElementClick(treeElement)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(treeElement.id);
                }}
                className="hover:bg-slate-600/50 rounded p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}
            {getElementIcon(treeElement)}
            <span className="text-xs truncate flex-1">{getElementLabel(treeElement)}</span>
            <span className="text-xs text-slate-500 font-mono">#{treeElement.id}</span>
          </div>
          {hasChildren && isExpanded && renderTree(treeElement.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="max-h-96 overflow-auto">
      {treeData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-700/30 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <p className="text-xs text-slate-300 font-medium">No elements</p>
          <p className="text-xs text-slate-500 mt-1">Add elements to see them here</p>
        </div>
      ) : (
        <div className="space-y-1 p-2">{renderTree(treeData)}</div>
      )}
    </div>
  );
}
