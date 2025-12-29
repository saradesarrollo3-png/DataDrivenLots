// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Traceability {

    struct BatchData {
        string batchCode;
        string productType;
        string currentStage;
        bool isQualityVerified;
        uint256 timestamp;
        address certifier; // Quién registró el dato
    }

    // Mapeo del código de lote a su historial
    mapping(string => BatchData[]) public batchHistory;

    // Eventos para facilitar la lectura externa
    event BatchRegistered(string indexed batchCode, string stage, uint256 timestamp);
    event QualityCertified(string indexed batchCode, bool approved, uint256 timestamp);

    // 1. Registro Inmutable de Trazabilidad
    function registerTraceabilityEvent(
        string memory _batchCode, 
        string memory _productType,
        string memory _stage
    ) public {
        BatchData memory newRecord = BatchData({
            batchCode: _batchCode,
            productType: _productType,
            currentStage: _stage,
            isQualityVerified: false,
            timestamp: block.timestamp,
            certifier: msg.sender
        });

        batchHistory[_batchCode].push(newRecord);
        emit BatchRegistered(_batchCode, _stage, block.timestamp);
    }

    // 2. Smart Contract para Certificación de Calidad
    // Solo permite avanzar si se cumple la condición (en este caso, aprobado = true)
    function certifyQuality(string memory _batchCode, bool _approved) public {
        require(batchHistory[_batchCode].length > 0, "El lote no existe");

        // Lógica de automatización: Si se rechaza, se podría bloquear el lote en la blockchain
        BatchData storage lastRecord = batchHistory[_batchCode][batchHistory[_batchCode].length - 1];
        lastRecord.isQualityVerified = _approved;

        emit QualityCertified(_batchCode, _approved, block.timestamp);
    }

    // Función para obtener el historial completo (para el QR)
    function getBatchHistory(string memory _batchCode) public view returns (BatchData[] memory) {
        return batchHistory[_batchCode];
    }
}