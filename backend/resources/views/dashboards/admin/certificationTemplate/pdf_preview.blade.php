<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            background-image: url('{{ $backgroundUrl }}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            height: 100vh;
            font-family: DejaVu Sans, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 50px;
            box-sizing: border-box;
            flex-direction: column;
        }

        .editable-placeholder {
            display: inline-block;
            border-bottom: 1px dashed #007bff;
            padding: 2px;
            font-size: 20px;
        }

        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            font-size: 16px;
            cursor: pointer;
            border-radius: 5px;
            z-index: 1000;
        }

        @media print {
            body {
        -webkit-print-color-adjust: exact !important; /* Safari/Chrome */
        print-color-adjust: exact !important;         /* Firefox */
        background-image: url('{{ $backgroundUrl }}') !important;
        background-size: contain !important;
        background-repeat: no-repeat !important;
        background-position: center !important;
    }
            .print-button {
                display: none;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">Print</button>

    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        {!! $htmlContent !!}
    </div>
</body>
</html>
